import { $ } from 'bun';

const entryPath = 'src/index.ts';
const generatedPath = 'assets/logic-core.global.d.ts';

// remove old files
console.log('Removing old files...');
await $`rm -rf ./scripts/temp`.nothrow();
await $`rm ${generatedPath}`.nothrow();

try {
  // bundle the data types into one file
  console.log('Bundling types...');
  await $`bunx --bun dts-bundle-generator -o ${generatedPath} ${entryPath} --no-check --verbose`.throws(
    true
  );

  // wrap the bundled types in a global declaration
  let file = await Bun.file(generatedPath).text();

  file = `
      /* prettier-ignore-start */

      /* eslint-disable */

      // @ts-nocheck

      // noinspection JSUnusedGlobalSymbols
      declare global {
        ${file}
        export { Symbol$1 as _Symbol };
      }
      export {};

      /* prettier-ignore-end */
    `;
  file = file.replace(/\r\n/g, '\n');

  await Bun.write(generatedPath, file);

  // format the file
  console.log('Formatting types...');
  await $`bunx prettier --write ${generatedPath}`;
} catch (err) {
  console.error(err);
  if (err instanceof $.ShellError) {
    console.error(err.stderr);
  }
}

// remove the temporary files
console.log('Cleaning up...');
await $`rm -rf ./scripts/temp`;

console.log('Done!');

process.exit(0); // workaround for a Bun bug
