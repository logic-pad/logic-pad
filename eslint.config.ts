import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { importX as pluginImport } from 'eslint-plugin-import-x';
import pluginNode from 'eslint-plugin-n';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

export default defineConfig([
  js.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/scripts/temp/**',
    '**/*.global.d.ts',
    '.tanstack/**',
    '.vercel/**',
    'references/**',
  ]),
  {
    name: 'Main config',
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      'import-x': pluginImport as any,
      react: pluginReact,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      'react-hooks': reactHooks as any,
      prettier: pluginPrettier,
    },
    extends: [
      'js/recommended',
      'import-x/flat/recommended',
      pluginReact.configs.flat.recommended,
      pluginReact.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      pluginPrettierRecommended,
    ],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
          project: [
            './tsconfig.json',
            './tsconfig.node.json',
            './packages/logic-core/tsconfig.json',
            './packages/logic-core/tsconfig.node.json',
          ],
          bun: true,
        }),
      ],
    },
    rules: {
      '@typescript-eslint/class-literal-property-style': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false, attributes: false } },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unused-expressions': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-use-before-define': ['error'],
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/only-throw-error': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      'import-x/default': 'off',
      'import-x/named': 'off',
      'import-x/no-anonymous-default-export': ['error', { allowNew: true }],
      'import-x/no-unresolved': ['error', { ignore: ['^virtual:'] }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-labels': ['error', { allowLoop: true }],
      'no-redeclare': 'off',
      'no-unused-vars': 'off',
      'no-use-before-define': 'off',
      'no-void': 'off',
      'prettier/prettier': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/refs': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    name: 'Node config',
    files: [
      'packages/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/ssr/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    plugins: {
      n: pluginNode,
    },
    extends: [pluginNode.configs['flat/recommended-module']],
    languageOptions: {
      globals: {
        ...globals.es2020,
        ...globals.node,
        Bun: 'readonly',
      },
    },
    rules: {
      'n/no-process-exit': 'off',
      'n/no-missing-import': 'off',
    },
  },
]);
