const path = require('path');

const { fixupPluginRules } = require('@eslint/compat');
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const _import = require('eslint-plugin-import');
const importNewlines = require('eslint-plugin-import-newlines');
const packageJson = require('eslint-plugin-package-json');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const sortKeysFix = require('eslint-plugin-sort-keys-fix');
const globals = require('globals');

const {
  defineConfig,
  globalIgnores,
} = require('eslint/config');

const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = defineConfig([{
  extends: compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),
  files: ['**/*.ts', '**/*.js'],
  languageOptions: {
    ecmaVersion: 2022,
    globals: {
      ...globals.node,
    },
    parser: tsParser,
    parserOptions: {
      project: path.join(__dirname, 'tsconfig.json'),
      tsconfigRootDir: __dirname,
    },
    sourceType: 'module',
  },
  plugins: {
    '@stylistic': stylistic,
    import: fixupPluginRules(_import),
    'import-newlines': importNewlines,
    'simple-import-sort': simpleImportSort,
    'sort-keys-fix': fixupPluginRules(sortKeysFix),
  },
  rules: {
    '@stylistic/semi': [2, 'always'],
    '@stylistic/space-infix-ops': 'error',
    '@typescript-eslint/array-type': ['error', {
      default: 'generic',
      readonly: 'generic',
    }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'comma-dangle': [2, 'always-multiline'],
    'eol-last': 'error',
    'import-newlines/enforce': ['error', {
      allowBlankLines: false,
      forceSingleLine: true,
      items: 2,
      'max-len': 120,
      semi: true,
    }],
    'import/no-duplicates': 'error',
    indent: ['error', 2, {
      SwitchCase: 1,
    }],
    'keyword-spacing': ['error', {
      overrides: {
        for: {
          after: false,
        },
        function: {
          after: false,
        },
        if: {
          after: false,
        },
        switch: {
          after: false,
        },
        while: {
          after: false,
        },
      },
    }],
    'no-console': 'warn',
    'no-multiple-empty-lines': ['error', {
      max: 1,
      maxBOF: 0,
    }],
    'no-restricted-syntax': ['error', {
      message: 'Use custom exceptions from @self/exceptions instead of throw new Error().',
      selector: 'ThrowStatement > NewExpression[callee.name="Error"]',
    }],
    'no-trailing-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    quotes: [2, 'single', {
      avoidEscape: true,
    }],
    'simple-import-sort/exports': 'error',
    'simple-import-sort/imports': 'error',
    'sort-keys-fix/sort-keys-fix': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'never',
      asyncArrow: 'always',
      named: 'never',
    }],
  },
}, {
  files: ['**/*.test.ts', 'tests/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
}, {
  files: ['scripts/**/*'],
  rules: {
    'no-console': 'off',
  },
}, {
  ...packageJson.configs.recommended,
  files: ['package.json'],
  rules: {
    ...packageJson.configs.recommended.rules,
    'package-json/require-attribution': 'off',
    'package-json/require-description': 'off',
    'package-json/require-exports': 'off',
    'package-json/require-files': 'off',
    'package-json/require-license': 'off',
    'package-json/require-repository': 'off',
    'package-json/require-sideEffects': 'off',
    'package-json/require-type': 'off',
    'package-json/restrict-dependency-ranges': ['error', {
      rangeType: 'pin',
    }],
    'package-json/sort-collections': 'off',
  },
}, globalIgnores(['**/node_modules', '**/dist', '**/*.config.js', '**/*.config.ts'])]);
