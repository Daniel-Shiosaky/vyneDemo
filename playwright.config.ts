import { defineConfig, devices } from '@playwright/test';

import { ENV } from './shared/const/env.const';
import { authStatePath } from './ui/util/auth.util';

const isCI = !!process.env.CI;

/**
 * Projects keep the two suites independently runnable:
 *
 *   npm run test:ui    -> ui-chromium, browser tests against SauceDemo
 *   npm run test:api   -> api, HTTP tests against JSONPlaceholder (no browser launched)
 *
 * `ui-firefox` and `ui-webkit` are configured for cross-browser runs but excluded from the npm
 * scripts, and `install:browsers` fetches only Chromium, so CI stays fast. Opt in with
 * `npx playwright install firefox webkit && npx playwright test --project=ui-firefox`.
 */
export default defineConfig({
  testDir: '.',
  testMatch: '**/*.test.ts',

  /** Fail the build if someone leaves `test.only` in a commit. */
  forbidOnly: isCI,

  /** Retry only in CI. Locally a failure should be seen, not papered over. */
  retries: isCI ? 2 : 0,

  /** Bounded parallelism in CI for reproducibility; use the local machine fully otherwise. */
  fullyParallel: true,
  workers: isCI ? 4 : undefined,

  /**
   * Timeouts are deliberately modest. No test needs longer than this; a hang is a bug worth
   * surfacing. The one genuinely slow test (performance_glitch_user) calls `test.slow()`
   * itself rather than inflating the global budget.
   */
  timeout: 45_000,
  expect: { timeout: 10_000 },

  reporter: isCI
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    /**
     * SauceDemo instruments its DOM with `data-test`, not Playwright's default `data-testid`.
     * Setting it once here lets every page object use the built-in `getByTestId()`.
     */
    testIdAttribute: 'data-test',

    /** Diagnostics on failure only - traces are large and a green run needs none. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    /**
     * Authenticates every usable account and saves the sessions the UI projects reuse.
     * Declared as a dependency below, so it runs only when a UI project runs - an API-only
     * run never launches a browser and needs no SauceDemo credentials.
     */
    {
      name: 'ui-setup',
      testDir: '.',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: ENV.WEB_BASE_URL },
    },
    {
      name: 'ui-chromium',
      testDir: './ui/spec',
      dependencies: ['ui-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ENV.WEB_BASE_URL,
        /**
         * Every UI spec starts already signed in as the standard account. Specs needing a
         * different account, or none, override this with `test.use({ storageState })`.
         */
        storageState: authStatePath('standard'),
      },
    },
    // Chromium only for now. To add another browser, run `npx playwright install <browser>`
    // first, then copy the block above with the matching `devices[...]` descriptor.
    {
      name: 'api',
      testDir: './api/spec',
      use: {
        baseURL: ENV.API_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],
});
