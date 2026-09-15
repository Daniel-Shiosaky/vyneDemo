import { ALL_SORT_OPTIONS } from '@ui/data/const/product.const';
import { test } from '@ui/fixtures';

/**
 * E2E journey: browsing and reordering the catalog.
 *
 * Kept as one data-driven test over the four sort modes rather than four separate tests - the
 * journey is identical and only the selected mode differs.
 */
test.describe('E2E: Product catalog', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.open();
  });

  test('Verify the catalog lists every product with a correctly formatted price', async ({
    inventoryValidator,
  }) => {
    await inventoryValidator.verifyCatalogIsDisplayed();
    await inventoryValidator.verifyProductPricesUseMoneyFormat();
  });

  for (const sortOption of ALL_SORT_OPTIONS) {
    test(`Verify products can be sorted by ${sortOption.label}`, async ({
      inventoryPage,
      inventoryValidator,
    }) => {
      await inventoryPage.sortProductsBy(sortOption);

      await inventoryValidator.verifyProductsAreSortedBy(sortOption);
    });
  }
});
