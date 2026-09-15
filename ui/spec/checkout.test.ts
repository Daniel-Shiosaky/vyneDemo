import { VALID_CHECKOUT_DETAILS } from '@ui/data/const/checkout.const';
import { PRODUCTS } from '@ui/data/const/product.const';
import { test } from '@ui/fixtures';

/**
 * E2E journeys through checkout: reviewing the order, abandoning it, completing it, downloading
 * the receipt, and returning to the catalog afterwards.
 *
 * Navigation is delegated to `checkoutFlow` so each journey contains only its own steps and
 * assertions rather than repeating the six-step path to the overview.
 */
const ORDERED_PRODUCTS = [PRODUCTS.backpack, PRODUCTS.onesie];

test.describe('E2E: Checkout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('Verify the order overview shows the correct items, prices and totals', async ({
    checkoutFlow,
    checkoutValidator,
  }) => {
    await checkoutFlow.goToOverview(ORDERED_PRODUCTS);

    await checkoutValidator.verifyOverviewIsDisplayed();
    await checkoutValidator.verifyOrderedProducts(ORDERED_PRODUCTS);
    await checkoutValidator.verifyOrderTotals(ORDERED_PRODUCTS);
    await checkoutValidator.verifyAmountsUseMoneyFormat();
    await checkoutValidator.verifyPaymentAndShippingInformation();
  });

  /**
   * Checkout can be abandoned at either step. These are two tests rather than one data-driven
   * test because the two exits land the user in genuinely different places, so each has its own
   * expected outcome to state.
   */
  test('Verify cancelling at the buyer information step returns the user to the cart', async ({
    checkoutFlow,
    checkoutInformationPage,
    cartPage,
    cartValidator,
  }) => {
    await checkoutFlow.goToInformationStep(ORDERED_PRODUCTS);

    await checkoutInformationPage.cancel();
    await cartPage.waitUntilReady();

    await cartValidator.verifyCartPageIsDisplayed();
    // Abandoning checkout must not discard the cart.
    await cartValidator.verifyCartContains(ORDERED_PRODUCTS);
  });

  test('Verify cancelling at the order overview returns the user to the catalog', async ({
    checkoutFlow,
    checkoutOverviewPage,
    inventoryPage,
    inventoryValidator,
    cartValidator,
  }) => {
    await checkoutFlow.goToOverview(ORDERED_PRODUCTS);

    await checkoutOverviewPage.cancel();
    await inventoryPage.waitUntilReady();

    await inventoryValidator.verifyCatalogIsDisplayed();
    await cartValidator.verifyCartBadgeCount(ORDERED_PRODUCTS.length);
  });

  test('Verify user can finish checkout and see the order confirmation', async ({
    checkoutFlow,
    checkoutOverviewPage,
    checkoutValidator,
  }) => {
    await checkoutFlow.goToOverview(ORDERED_PRODUCTS);

    await checkoutOverviewPage.finishOrder();

    await checkoutValidator.verifyOrderIsConfirmed();
  });

  test('Verify the completed order can be downloaded as a PDF receipt', async ({
    checkoutFlow,
    checkoutCompletePage,
    checkoutValidator,
  }) => {
    await checkoutFlow.completeOrder(ORDERED_PRODUCTS);

    const orderReceipt = await checkoutCompletePage.downloadOrderPdf();

    // Asserts what the receipt actually says, not how it is built.
    await checkoutValidator.verifyOrderReceiptPdf(
      orderReceipt,
      ORDERED_PRODUCTS,
      VALID_CHECKOUT_DETAILS,
    );
  });

  test('Verify user is returned to the catalog after finishing checkout', async ({
    checkoutFlow,
    checkoutCompletePage,
    inventoryPage,
    inventoryValidator,
    cartValidator,
  }) => {
    await checkoutFlow.completeOrder(ORDERED_PRODUCTS);

    await checkoutCompletePage.goBackHome();
    await inventoryPage.waitUntilReady();

    await inventoryValidator.verifyCatalogIsDisplayed();
    // The cart stays empty after the order, so the user starts a fresh basket.
    await cartValidator.verifyCartBadgeCount(0);
  });

  test(
    'Verify an empty cart can be checked out to completion',
    { tag: '@known-issue' },
    async ({ checkoutFlow, checkoutInformationPage, checkoutOverviewPage, checkoutValidator }) => {
      // 🐞 Asserts ACTUAL buggy behaviour: the app confirms a $0 order for nothing.
      // See CheckoutValidator.verifyEmptyOrderIsAccepted for the full description.
      await checkoutFlow.goToInformationStepWithEmptyCart();

      await checkoutInformationPage.submitBuyerDetails(VALID_CHECKOUT_DETAILS);
      await checkoutOverviewPage.waitUntilReady();

      await checkoutValidator.verifyEmptyOrderIsAccepted();

      await checkoutOverviewPage.finishOrder();

      await checkoutValidator.verifyOrderIsConfirmed();
    },
  );
});
