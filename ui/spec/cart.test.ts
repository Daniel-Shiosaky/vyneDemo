import { PRODUCTS } from '@ui/data/const/product.const';
import { test } from '@ui/fixtures';

/**
 * E2E journeys: putting products in the cart and taking them out again.
 *
 * Starts from the saved session, so no journey here repeats the login form.
 */
test.describe('E2E: Cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('Verify user can add items to the cart', async ({
    inventoryPage,
    cartPage,
    cartValidator,
  }) => {
    const productsToAdd = [PRODUCTS.backpack, PRODUCTS.onesie];

    // A new session starts with an empty cart - storageState carries the session, not the cart.
    await cartValidator.verifyCartBadgeCount(0);

    await inventoryPage.addProductsToCart(productsToAdd.map((product) => product.name));

    await cartValidator.verifyCartBadgeCount(productsToAdd.length);
    await cartValidator.verifyProductShowsAsAddedOnCatalog(PRODUCTS.backpack.name);

    await inventoryPage.openCart();
    await cartPage.waitUntilReady();

    await cartValidator.verifyCartPageIsDisplayed();
    await cartValidator.verifyCartContains(productsToAdd);
  });

  test('Verify user can remove an item from the cart', async ({
    inventoryPage,
    cartPage,
    cartValidator,
  }) => {
    const productToKeep = PRODUCTS.backpack;
    const productToRemove = PRODUCTS.bikeLight;

    await inventoryPage.addProductsToCart([productToKeep.name, productToRemove.name]);
    await inventoryPage.openCart();
    await cartPage.waitUntilReady();

    await cartPage.removeProduct(productToRemove.name);

    await cartValidator.verifyProductIsNotInCart(productToRemove.name);
    await cartValidator.verifyCartContains([productToKeep]);
    await cartValidator.verifyCartBadgeCount(1);

    // Removing the last item empties the cart and drops the badge entirely.
    await cartPage.removeProduct(productToKeep.name);

    await cartValidator.verifyCartIsEmpty();

    // Back on the catalog, the product is offered for adding again.
    await cartPage.continueShopping();
    await inventoryPage.waitUntilReady();

    await cartValidator.verifyProductShowsAsRemovedOnCatalog(productToKeep.name);
  });

  test(
    'Verify Reset App State clears the cart but leaves stale Remove buttons',
    { tag: '@known-issue' },
    async ({ inventoryPage, cartPage, cartValidator }) => {
      // 🐞 Asserts ACTUAL buggy behaviour so the suite stays green.
      // See CartValidator.verifyResetLeavesStaleRemoveButtons for the full description.
      await inventoryPage.addProductToCart(PRODUCTS.backpack.name);

      await inventoryPage.getHeader().resetAppState();

      await cartValidator.verifyResetLeavesStaleRemoveButtons(PRODUCTS.backpack.name);

      // Confirms the cart really is empty, so the button state is genuinely wrong.
      await inventoryPage.openCart();
      await cartPage.waitUntilReady();
      await cartValidator.verifyCartIsEmpty();
    },
  );
});
