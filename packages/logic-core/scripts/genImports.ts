import path from 'path';
import fg from 'fast-glob';
import { extractName, stripExtension } from './scriptHelper.js';

export interface Config {
  entries: {
    cwd: string;
    glob: string[];
    generated: string;
    import: string;
  }[];
}

interface Module {
  path: string;
  name: string;
}

async function generateImports(config: Config) {
  console.log('♻️  Generating imports...');
  const now = performance.now();

  for (const entry of config.entries) {
    const modules: Module[] = [];
    const files = await fg([...entry.glob, `!${entry.generated}`], {
      cwd: entry.cwd,
    });
    files.sort();
    for (const file of files) {
      const module = (await import(
        stripExtension(path.resolve(process.cwd(), entry.cwd, file))
      )) as Record<string, unknown>;

      const name = extractName(module[entry.import]);

      if (name === undefined) {
        if (module[entry.import])
          console.warn('Could not determine name for', module[entry.import]);
        continue;
      }

      modules.push({ path: file, name });
    }

    const source = `/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

${
  entry.import === 'default'
    ? modules
        .map(m => `export ${m.name} from './${stripExtension(m.path)}.js';`)
        .join('\n')
    : modules
        .map(
          m =>
            `export { ${entry.import} as ${m.name} } from './${stripExtension(m.path)}.js';`
        )
        .join('\n')
}`;

    await Bun.write(
      path.resolve(process.cwd(), entry.cwd, entry.generated),
      source
    );
  }

  console.log(
    '✅ Imports generated in',
    Math.round(performance.now() - now),
    'ms'
  );
}

await generateImports({
  entries: [
    {
      cwd: 'src/data/symbols',
      generated: 'symbols.gen.ts',
      import: 'instance',
      glob: ['./**/*.ts', '!./index.ts'],
    },
    {
      cwd: 'src/data/rules',
      generated: 'rules.gen.ts',
      import: 'instance',
      glob: ['./**/*.ts', '!./index.ts'],
    },
  ],
});

process.exit(0); // workaround for a Bun bug
