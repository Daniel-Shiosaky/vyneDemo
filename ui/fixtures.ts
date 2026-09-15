import { test as base } from '@playwright/test';

import { CartPage } from '@ui/page/cart.page';
import { CheckoutCompletePage } from '@ui/page/checkout-complete.page';
import { CheckoutInformationPage } from '@ui/page/checkout-information.page';
import { CheckoutOverviewPage } from '@ui/page/checkout-overview.page';
import { InventoryPage } from '@ui/page/inventory.page';
import { LoginPage } from '@ui/page/login.page';
import { CartValidator } from '@ui/validator/cart.validator';
import { CheckoutValidator } from '@ui/validator/checkout.validator';
import { InventoryValidator } from '@ui/validator/inventory.validator';
import { LoginValidator } from '@ui/validator/login.validator';
import { CheckoutFlow } from '@ui/util/checkout-flow.util';

/**
 * Page objects, validators and the checkout flow, injected into specs.
 *
 * Specs never construct any of these. A spec declares what it needs in its destructured argument
 * list and Playwright builds only those, lazily — so the login journey costs nothing for the
 * checkout page objects.
 *
 * Adding a page object is three lines: import it, add it to `UiFixtures`, add the factory.
 * Validators take their page objects as fixture dependencies, so wiring stays declarative.
 */
export interface UiFixtures {
  // Pages
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInformationPage: CheckoutInformationPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;

  // Validators
  loginValidator: LoginValidator;
  inventoryValidator: InventoryValidator;
  cartValidator: CartValidator;
  checkoutValidator: CheckoutValidator;

  // Multi-page journey helper
  checkoutFlow: CheckoutFlow;
}

export const test = base.extend<UiFixtures>({
  // ---- Pages ----
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInformationPage: async ({ page }, use) => {
    await use(new CheckoutInformationPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },

  // ---- Validators ----
  loginValidator: async ({ loginPage }, use) => {
    await use(new LoginValidator(loginPage));
  },
  inventoryValidator: async ({ inventoryPage }, use) => {
    await use(new InventoryValidator(inventoryPage));
  },
  cartValidator: async ({ cartPage, inventoryPage }, use) => {
    await use(new CartValidator(cartPage, inventoryPage));
  },
  checkoutValidator: async (
    { checkoutInformationPage, checkoutOverviewPage, checkoutCompletePage },
    use,
  ) => {
    await use(
      new CheckoutValidator(checkoutInformationPage, checkoutOverviewPage, checkoutCompletePage),
    );
  },

  // ---- Journey helper ----
  checkoutFlow: async (
    {
      inventoryPage,
      cartPage,
      checkoutInformationPage,
      checkoutOverviewPage,
      checkoutCompletePage,
    },
    use,
  ) => {
    await use(
      new CheckoutFlow(
        inventoryPage,
        cartPage,
        checkoutInformationPage,
        checkoutOverviewPage,
        checkoutCompletePage,
      ),
    );
  },
});

export { expect } from '@playwright/test';
