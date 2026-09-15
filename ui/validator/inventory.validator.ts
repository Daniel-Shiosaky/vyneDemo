import { expect } from '@playwright/test';

import { MONEY_FORMAT, PAGE_TITLE } from '@ui/data/const/checkout.const';
import { EXPECTED_PRODUCT_COUNT } from '@ui/data/const/product.const';
import type { InventoryPage } from '@ui/page/inventory.page';
import type { SortOption } from '@ui/types/product.interface';

/** Assertions for the product catalog. */
export class InventoryValidator {
  constructor(private readonly inventoryPage: InventoryPage) {}

  /** The authenticated landing state: the catalog is on screen with its full product list. */
  async verifyCatalogIsDisplayed(): Promise<void> {
    await expect(this.inventoryPage.getTitle()).toHaveText(PAGE_TITLE.products);
    await expect(this.inventoryPage.getProductCards()).toHaveCount(EXPECTED_PRODUCT_COUNT);
  }

  /** Every catalog price is rendered as `$n.nn`. */
  async verifyProductPricesUseMoneyFormat(): Promise<void> {
    const renderedPrices = await this.inventoryPage.readRenderedProductPrices();
    expect(renderedPrices).toHaveLength(EXPECTED_PRODUCT_COUNT);

    for (const renderedPrice of renderedPrices) {
      expect(renderedPrice, `catalog price "${renderedPrice}"`).toMatch(MONEY_FORMAT);
    }
  }

  /**
   * Products are ordered per the selected mode, and the dropdown reports that mode.
   *
   * Compared against a locally sorted copy of the values actually on screen rather than a
   * hard-coded list, so this still holds if the catalog changes.
   */
  async verifyProductsAreSortedBy(sortOption: SortOption): Promise<void> {
    await expect(this.inventoryPage.getActiveSortOption()).toHaveText(sortOption.label);

    if (sortOption.sortBy === 'name') {
      const displayedNames = await this.inventoryPage.readProductNames();
      const expectedNames = [...displayedNames].sort((firstName, secondName) =>
        sortOption.direction === 'ascending'
          ? firstName.localeCompare(secondName)
          : secondName.localeCompare(firstName),
      );
      expect(displayedNames).toEqual(expectedNames);
      return;
    }

    const displayedPrices = await this.inventoryPage.readProductPrices();
    const expectedPrices = [...displayedPrices].sort((firstPrice, secondPrice) =>
      sortOption.direction === 'ascending' ? firstPrice - secondPrice : secondPrice - firstPrice,
    );
    expect(displayedPrices).toEqual(expectedPrices);
  }
}
