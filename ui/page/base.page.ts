import type { Page } from '@playwright/test';

/**
 * Shared contract for every page object.
 *
 * Layer rules this enforces:
 *
 * 1. **No assertions.** Page objects expose locators (via getters) and user actions.
 *    All `expect()` calls live in the validator layer.
 *
 * 2. **`waitUntilReady()` waits on a DOM element unique to the page, never on the URL.**
 *    SauceDemo changes the URL 1-2 seconds before it re-renders, so a URL-based wait reads a
 *    stale DOM - on the product detail page that means 6 stale inventory items and a
 *    strict-mode violation. See docs/EXPLORATION-FINDINGS.md 1.4.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Path this page lives at, relative to the configured base URL. */
  abstract readonly path: string;

  /** Resolves once this page has actually rendered. */
  abstract waitUntilReady(): Promise<void>;

  /** Navigates directly to this page and waits for it to render. */
  async open(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitUntilReady();
  }

  /** Current URL, for validators that assert on navigation. */
  getUrl(): string {
    return this.page.url();
  }
}
