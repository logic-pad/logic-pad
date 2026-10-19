import path from 'path';
import fg from 'fast-glob';
import { extractName, stripExtension } from './scriptHelper.js';

export interface Config {
  dataPath: string;
  generatedPath: string;
}

interface Module {
  path: string;
  module: Record<string, unknown>;
  defaultExport: string | undefined;
  namedExports: string[];
}

async function generateEntry(config: Config) {
  const dataPath = config.dataPath;
  const generatedPath = config.generatedPath;

  console.log('♻️  Generating enclosure...');
  const now = performance.now();

  const modules: Module[] = [];
  const files = await fg(['**/*.ts', '!**/*.gen.ts'], { cwd: dataPath });
  files.sort();
  for (const file of files) {
    const module = (await import(
      stripExtension(path.resolve(process.cwd(), dataPath, file))
    )) as Record<string, unknown>;

    if (typeof module !== 'object' || module === null || module === undefined)
      continue;

    const relative = path.relative('src/', dataPath);
    const result: Module = {
      path:
        './' +
        path
          .join(
            relative.length === 0 ? '.' : relative,
            file.replaceAll('.ts', '').replaceAll('\\', '/')
          )
          .replaceAll('\\', '/') +
        '.js',
      module,
      defaultExport: undefined,
      namedExports: [],
    };

    if ('default' in module) {
      const value = module.default;
      if (
        (typeof value === 'object' || typeof value === 'function') &&
        value !== null &&
        value !== undefined
      ) {
        const key = extractName(value);
        if (key) result.defaultExport = key;
        else console.warn('Could not determine name for', value);
      }
    }
    Object.entries(module).forEach(([key, value]) => {
      if (key === 'instance' || key === 'default') return;
      if (
        (typeof value !== 'object' && typeof value !== 'function') ||
        value === null ||
        value === undefined
      )
        return;
      result.namedExports.push(key);
    });
    modules.push(result);
  }

  const source = `/* prettier-ignore-start */

/* eslint-disable */

// noinspection JSUnusedGlobalSymbols

${modules
  .map(module => {
    if (module.defaultExport && module.namedExports.length > 0)
      return `import ${module.defaultExport}, { ${module.namedExports.join(
        ', '
      )} } from '${module.path}';`;
    else if (module.defaultExport)
      return `import ${module.defaultExport} from '${module.path}';`;
    else if (module.namedExports.length > 0)
      return `import { ${module.namedExports.join(', ')} } from '${module.path}';`;
    return '';
  })
  .filter(s => s.length > 0)
  .join('\n')}

export {
${modules
  .flatMap(module => {
    if (module.defaultExport && module.namedExports.length > 0)
      return [module.defaultExport, ...module.namedExports];
    else if (module.defaultExport) return [module.defaultExport];
    else if (module.namedExports.length > 0) return module.namedExports;
    return [];
  })
  .map(name => `  ${name},`)
  .join('\n')}
};
`;

  await Bun.write(generatedPath, source);

  console.log(
    '✅ Enclosure generated in',
    Math.round(performance.now() - now),
    'ms'
  );
}

await generateEntry({
  dataPath: 'src/data',
  generatedPath: 'src/index.gen.ts',
});

process.exit(0); // workaround for a Bun bug
