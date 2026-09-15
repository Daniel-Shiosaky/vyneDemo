import { expect } from '@playwright/test';

import { MONEY_FORMAT, PAGE_TITLE } from '@ui/data/const/checkout.const';
import type { CartPage } from '@ui/page/cart.page';
import type { InventoryPage } from '@ui/page/inventory.page';
import type { Product } from '@ui/types/product.interface';

/**
 * Assertions for the cart and the cart badge.
 *
 * Takes both page objects because cart state is observable from two places: the badge in the
 * shared header (visible on the catalog) and the cart page's own line items.
 */
export class CartValidator {
  constructor(
    private readonly cartPage: CartPage,
    private readonly inventoryPage: InventoryPage,
  ) {}

  async verifyCartPageIsDisplayed(): Promise<void> {
    await expect(this.cartPage.getTitle()).toHaveText(PAGE_TITLE.cart);
  }

  /**
   * The badge shows `expectedCount`.
   *
   * When `expectedCount` is 0 this asserts the element is ABSENT, because the app removes the
   * badge entirely rather than rendering "0" (docs/EXPLORATION-FINDINGS.md 1.5).
   */
  async verifyCartBadgeCount(expectedCount: number): Promise<void> {
    const cartBadge = this.inventoryPage.getHeader().getCartBadge();

    if (expectedCount === 0) {
      await expect(cartBadge).toHaveCount(0);
      return;
    }
    await expect(cartBadge).toHaveText(String(expectedCount));
  }

  async verifyCartIsEmpty(): Promise<void> {
    await expect(this.cartPage.getCartLineItems()).toHaveCount(0);
    await expect(this.cartPage.getHeader().getCartBadge()).toHaveCount(0);
  }

  /**
   * The cart holds exactly these products, each with the correct price and a quantity of 1,
   * and every price is rendered in the money format.
   */
  async verifyCartContains(expectedProducts: readonly Product[]): Promise<void> {
    await expect(this.cartPage.getCartLineItems()).toHaveCount(expectedProducts.length);

    const cartLineItems = await this.cartPage.readLineItems();
    expect(cartLineItems.map((lineItem) => lineItem.name).sort()).toEqual(
      expectedProducts.map((product) => product.name).sort(),
    );

    for (const expectedProduct of expectedProducts) {
      const matchingLineItem = cartLineItems.find(
        (lineItem) => lineItem.name === expectedProduct.name,
      );
      expect(matchingLineItem, `expected "${expectedProduct.name}" in the cart`).toBeDefined();
      expect(matchingLineItem?.price).toBe(expectedProduct.price);
      expect(matchingLineItem?.quantity).toBe(1);
    }

    for (const renderedPrice of await this.cartPage.readRenderedProductPrices()) {
      expect(renderedPrice, `cart price "${renderedPrice}"`).toMatch(MONEY_FORMAT);
    }
  }

  async verifyProductIsNotInCart(productName: string): Promise<void> {
    await expect(this.cartPage.getLineItemFor(productName)).toHaveCount(0);
  }

  /** On the catalog, an added product's control flips to "Remove". */
  async verifyProductShowsAsAddedOnCatalog(productName: string): Promise<void> {
    await expect(this.inventoryPage.getRemoveButton(productName)).toBeVisible();
    await expect(this.inventoryPage.getAddToCartButton(productName)).toHaveCount(0);
  }

  /** On the catalog, a removed product's control reverts to "Add to cart". */
  async verifyProductShowsAsRemovedOnCatalog(productName: string): Promise<void> {
    await expect(this.inventoryPage.getAddToCartButton(productName)).toBeVisible();
    await expect(this.inventoryPage.getRemoveButton(productName)).toHaveCount(0);
  }

  /**
   * 🐞 Characterises a defect: "Reset App State" clears the badge but leaves every button
   * reading "Remove", so the UI claims an empty cart while offering to remove items from it
   * (docs/EXPLORATION-FINDINGS.md 1.10 #2).
   *
   * Asserts ACTUAL behaviour so the suite stays green. If this is fixed, this fails and should
   * be inverted.
   */
  async verifyResetLeavesStaleRemoveButtons(productName: string): Promise<void> {
    await expect(this.inventoryPage.getHeader().getCartBadge()).toHaveCount(0);
    // Correct after a reset would be "Add to cart". Actual: still "Remove".
    await expect(this.inventoryPage.getRemoveButton(productName)).toBeVisible();
    await expect(this.inventoryPage.getAddToCartButton(productName)).toHaveCount(0);
  }
}
