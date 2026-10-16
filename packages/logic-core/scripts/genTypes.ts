import { $ } from 'bun';
import path from 'node:path';

const tempDir = 'scripts/temp';
const rollupPath = path.join(tempDir, 'logic-core.rollup.d.ts');
const generatedPath = 'assets/logic-core.global.d.ts';
const verifyDir = path.join(tempDir, 'verify');

/**
 * Globals that the library must never shadow: the editor evaluates user code
 * against these, so replacing them with puzzle types would break built-ins.
 */
const reserved = new Set([
  'Array',
  'Boolean',
  'Function',
  'Map',
  'Number',
  'Object',
  'Set',
  'String',
  'Symbol',
]);

const banner = `/* prettier-ignore-start */\n\n/* eslint-disable */\n\n`;
const footer = `\n/* prettier-ignore-end */\n`;

/** Exercises the public API the same way puzzle source in the editor does. */
const consumerCode = `
/** @type {Puzzle} */
const puzzle = {
  title: 'Test',
  grid: GridData.create(['nnnnn', 'nnnnn']),
  solution: null,
  difficulty: 1,
  author: 'me',
  description: 'a description',
};

const edited = puzzle.grid
  .withConnections(GridConnections.create(['..aa.', '..aa.']))
  .withZones(new GridZones())
  .addRule(new BanPatternRule(GridData.create([])))
  .addRule(new CompletePatternRule())
  .addRule(new ConnectAllRule(Color.Dark))
  .addRule(new RegionAreaRule(Color.Dark, 2))
  .addRule(new OffByXRule(1))
  .addRule(new CellCountRule(Color.Dark, 10))
  .addRule(new SymbolsPerRegionRule(Color.Light, 1))
  .addRule(new CustomRule('Description', GridData.create([])))
  .addSymbol(new LetterSymbol(1, 1, 'A'))
  .addSymbol(new AreaNumberSymbol(1, 1, 3))
  .addSymbol(new ViewpointSymbol(1, 1, 3))
  .addSymbol(new DartSymbol(1, 1, 2, Orientation.Up))
  .addSymbol(new LotusSymbol(1, 1, Orientation.Up))
  .addSymbol(new GalaxySymbol(1, 1))
  .addSymbol(
    new CustomTextSymbol('Description', GridData.create([]), 1, 1, 'X', 0)
  );

/** @type {_Symbol | undefined} */
let symbol = undefined;
symbol = edited.findSymbol(s => s.x === 1);

const moved = move({ x: 1, y: 1 }, Direction.Up, 2);
const cells = array(3, 3, (x, y) => x + y);
const biggest = maxBy([1, 2, 3], x => x % 2);
const escaped = escape('Hello, world!', ',!');
const unescaped = unescape(escaped, ',!');
const same = configEquals(ConfigType.Number, 1, 2);
const satisfied = State.Satisfied;
const rules = allRules;
const parsed = PuzzleSchema.parse(puzzle);

/** Built-ins must keep working, so nothing above may shadow them. */
const builtins = [
  Array.from([1, 2]),
  Object.keys({ a: 1 }),
  [1, 2][Symbol.iterator](),
  new Map(),
  String(1),
];

console.log(
  edited,
  symbol,
  moved,
  cells,
  biggest,
  unescaped,
  same,
  satisfied,
  rules,
  parsed,
  builtins
);
`;

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces an import from an external package with local declarations, so the
 * result stays a script (and therefore a source of globals) rather than a
 * module.
 */
function stubExternal(name: string, text: string) {
  if (new RegExp(`\\b${escapeRegex(name)}\\b(?!\\s*\\.)`).test(text)) {
    return `declare type ${name} = any;`;
  }

  const chainRegex = new RegExp(
    `\\b${escapeRegex(name)}\\.((?:[A-Za-z_$][\\w$]*\\.)*[A-Za-z_$][\\w$]*)`,
    'g'
  );
  const arities = new Map<string, number>();
  for (const match of text.matchAll(chainRegex)) {
    let index = (match.index ?? 0) + match[0].length;
    while (/\s/.test(text[index])) index++;
    let arity = 0;
    if (text[index] === '<') {
      let depth = 0;
      let commas = 0;
      for (; index < text.length; index++) {
        const char = text[index];
        if (char === '<') depth++;
        else if (char === '>' && text[index - 1] !== '=') {
          depth--;
          if (depth === 0) break;
        } else if (char === ',' && depth === 1) commas++;
      }
      arity = commas + 1;
    }
    const chain = match[1];
    arities.set(chain, Math.max(arities.get(chain) ?? 0, arity));
  }

  interface Branch {
    children: Map<string, Branch>;
    arity: number;
  }
  const root: Branch = { children: new Map(), arity: 0 };
  for (const [chain, arity] of arities) {
    let node = root;
    for (const part of chain.split('.')) {
      node.children.set(
        part,
        node.children.get(part) ?? {
          children: new Map(),
          arity: 0,
        }
      );
      node = node.children.get(part)!;
    }
    node.arity = arity;
  }

  function render(node: Branch, indent: string): string[] {
    const lines: string[] = [];
    for (const [key, child] of node.children) {
      if (child.children.size > 0) {
        lines.push(`${indent}namespace ${key} {`);
        lines.push(...render(child, `${indent}  `));
        lines.push(`${indent}}`);
      } else {
        const params = Array.from(
          { length: child.arity },
          (_, i) => `A${i} = any`
        ).join(', ');
        lines.push(`${indent}type ${key}${params ? `<${params}>` : ''} = any;`);
      }
    }
    return lines;
  }

  const body = render(root, '  ');
  if (body.length === 0) return `declare type ${name} = any;`;
  return [`declare namespace ${name} {`, ...body, '}'].join('\n');
}

/** Turns api-extractor's module rollup into a flat set of global declarations. */
function toGlobalDeclarations(rollup: string) {
  const externals: string[] = [];
  const renames = new Map<string, string>();
  const lines: string[] = [];

  for (const line of rollup.replaceAll('\r\n', '\n').split('\n')) {
    const declaration = /^import\s+\{([^}]*)\}\s+from\s+'[^']*';?$/.exec(line);
    if (declaration) {
      for (const specifier of declaration[1].split(',')) {
        const name = specifier
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim();
        if (name) externals.push(name);
      }
      continue;
    }

    const alias = /^export\s+\{\s*(\S+)\s+as\s+(\S+)\s*\};?$/.exec(line);
    if (alias) {
      const [, local, exported] = alias;
      renames.set(local, reserved.has(exported) ? `_${exported}` : exported);
      continue;
    }

    if (/^export\s*\{\s*\}\s*;?$/.test(line)) continue;

    lines.push(line.replace(/^export\s+(?=\s*declare\b)/, ''));
  }

  let text = lines.join('\n');
  for (const [local, global] of renames) {
    text = text.replace(new RegExp(`\\b${escapeRegex(local)}\\b`, 'g'), global);
  }

  const stubs = externals.map(name => stubExternal(name, text));
  return [...stubs, text].join('\n');
}

const started = performance.now();
let last = started;

function step(label: string) {
  const now = performance.now();
  console.log(
    `${label}  +${Math.round(now - last)}ms (${Math.round(now - started)}ms)`
  );
  last = now;
}

console.log('Removing old files...');
await $`rm -rf ${tempDir}`;
await $`rm -f ${generatedPath}`;

let failed = false;
try {
  await $`bunx tsc -p tsconfig.typegen.json`.throws(true);
  step('Declarations emitted');

  await $`bunx api-extractor run --local`.throws(true);
  step('Declarations bundled');

  const declarations = toGlobalDeclarations(await Bun.file(rollupPath).text());
  await Bun.write(generatedPath, `${banner}${declarations}${footer}`);
  step(
    `Wrote ${generatedPath} (${Math.round(
      Bun.file(generatedPath).size / 1024
    )} kB)`
  );

  await Bun.write(
    path.join(verifyDir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        allowJs: true,
        checkJs: true,
        strict: true,
        noEmit: true,
        target: 'ES2020',
        lib: ['ES2020', 'DOM'],
      },
      files: [
        path.resolve(generatedPath).replaceAll('\\', '/'),
        path.resolve(verifyDir, 'consumer.js').replaceAll('\\', '/'),
      ],
    })
  );
  await Bun.write(path.join(verifyDir, 'consumer.js'), consumerCode);
  await $`bunx tsc -p ${path.join(verifyDir, 'tsconfig.json')}`.throws(true);
  step('Verified against sample puzzle code');
} catch (err) {
  failed = true;
  console.error(err);
  if (err instanceof $.ShellError) {
    const decoder = new TextDecoder();
    if (err.stdout) console.error(decoder.decode(err.stdout));
    if (err.stderr) console.error(decoder.decode(err.stderr));
  }
  console.error(`Keeping ${tempDir} for inspection.`);
}

if (!failed) await $`rm -rf ${tempDir}`;

console.log(failed ? 'Failed.' : 'Done!');

process.exit(failed ? 1 : 0); // workaround for a Bun bug
