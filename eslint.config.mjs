import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'blob-report/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Type-aware linting applies only to the TypeScript sources listed in tsconfig.json.
  // This config file itself is plain ESM and is not part of the project, so it must be
  // excluded here or the typed parser fails to resolve it.
  {
    files: ['ui/**/*.ts', 'api/**/*.ts', 'shared/**/*.ts', 'playwright.config.ts', 'auth.setup.ts'],
    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': 'warn',
    },
  },

  /**
   * Layer boundary enforcement.
   *
   * Page objects expose locators and actions; assertions belong in the validator layer. This
   * makes that rule mechanical rather than a convention people remember.
   */
  {
    files: ['ui/page/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['expect'],
              message:
                'Page objects must not assert. Move the expect() into the matching ui/validator/*.validator.ts.',
            },
          ],
        },
      ],
    },
  },

  // Playwright rules for the two spec folders and the auth setup.
  {
    files: ['ui/spec/**/*.test.ts', 'api/spec/**/*.test.ts', 'auth.setup.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,

      // Hard bans that enforce the waiting strategy in docs/EXPLORATION-FINDINGS.md 1.4.
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/prefer-web-first-assertions': 'error',

      // Specs delegate assertions to validators, so expect() rarely appears in a spec.
      // The validator call IS the assertion, which this rule cannot see.
      'playwright/expect-expect': 'off',
    },
  },

  // Must stay last so formatting rules do not fight Prettier.
  prettier,
);
