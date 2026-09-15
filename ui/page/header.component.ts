import type { Locator, Page } from '@playwright/test';

/**
 * The header and burger menu, present on every authenticated page.
 *
 * Modelled as a component rather than duplicated across page objects, since the cart badge and
 * menu actions are reachable from the catalog, the cart and all checkout steps. Every page object
 * composes one and exposes it via `getHeader()`.
 *
 * Note the app's attribute inconsistency: the menu open/close buttons are addressable only
 * by `id`, while the menu links use `data-test` (docs/EXPLORATION-FINDINGS.md 1.1).
 */
export class HeaderComponent {
  private readonly cartLink: Locator;
  private readonly cartBadge: Locator;
  private readonly openMenuButton: Locator;
  private readonly closeMenuButton: Locator;
  private readonly logoutLink: Locator;
  private readonly resetAppStateLink: Locator;

  constructor(private readonly page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.openMenuButton = page.locator('#react-burger-menu-btn');
    this.closeMenuButton = page.locator('#react-burger-cross-btn');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetAppStateLink = page.getByTestId('reset-sidebar-link');
  }

  // ---- Locator getters, for the validator layer ----

  getCartBadge(): Locator {
    return this.cartBadge;
  }

  // ---- Actions ----

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  /** Opens the burger menu and waits for the slide-out animation to finish. */
  async openMenu(): Promise<void> {
    await this.openMenuButton.click();
    await this.logoutLink.waitFor({ state: 'visible' });
  }

  async closeMenu(): Promise<void> {
    await this.closeMenuButton.click();
    await this.logoutLink.waitFor({ state: 'hidden' });
  }

  async logout(): Promise<void> {
    await this.openMenu();
    await this.logoutLink.click();
  }

  /**
   * Clears the cart via the menu.
   *
   * Known defect: this clears the badge but leaves every button reading "Remove"
   * (docs/EXPLORATION-FINDINGS.md 1.10 #2). Characterised in cart.test.ts.
   */
  async resetAppState(): Promise<void> {
    await this.openMenu();
    await this.resetAppStateLink.click();
    await this.cartBadge.waitFor({ state: 'detached' });
    await this.closeMenu();
  }

  /**
   * Number of items in the cart. Returns 0 when the badge is absent, which is how the app
   * represents an empty cart - it removes the element rather than rendering "0".
   */
  async readCartItemCount(): Promise<number> {
    if ((await this.cartBadge.count()) === 0) return 0;
    return Number.parseInt((await this.cartBadge.innerText()).trim(), 10);
  }
}
