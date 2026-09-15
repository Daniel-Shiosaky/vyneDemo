import type { Locator, Page } from '@playwright/test';

import type { SortOption } from '@ui/types/product.interface';
import { parsePrice, toProductSlug } from '@ui/util/price.util';
import { BasePage } from './base.page';
import { HeaderComponent } from './header.component';

/** The product catalog — the landing page for every authenticated journey. */
export class InventoryPage extends BasePage {
  readonly path = '/inventory.html';

  private readonly header: HeaderComponent;
  private readonly title: Locator;
  private readonly inventoryList: Locator;
  private readonly productCards: Locator;
  private readonly productNames: Locator;
  private readonly productPrices: Locator;
  private readonly sortDropdown: Locator;
  private readonly activeSortOption: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.inventoryList = page.getByTestId('inventory-list');
    this.productCards = page.getByTestId('inventory-item');
    this.productNames = page.getByTestId('inventory-item-name');
    this.productPrices = page.getByTestId('inventory-item-price');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.activeSortOption = page.getByTestId('active-option');
  }

  // ---- Locator getters, for the validator layer ----

  getHeader(): HeaderComponent {
    return this.header;
  }

  getTitle(): Locator {
    return this.title;
  }

  getProductCards(): Locator {
    return this.productCards;
  }

  getSortDropdown(): Locator {
    return this.sortDropdown;
  }

  getActiveSortOption(): Locator {
    return this.activeSortOption;
  }

  getAddToCartButton(productName: string): Locator {
    return this.page.getByTestId(`add-to-cart-${toProductSlug(productName)}`);
  }

  getRemoveButton(productName: string): Locator {
    return this.page.getByTestId(`remove-${toProductSlug(productName)}`);
  }

  // ---- Actions ----

  /** Waits on the product list, never the URL — see BasePage. */
  async waitUntilReady(): Promise<void> {
    await this.inventoryList.waitFor({ state: 'visible' });
  }

  async addProductToCart(productName: string): Promise<void> {
    await this.getAddToCartButton(productName).click();
    // The button flipping to "Remove" confirms the app registered the change.
    await this.getRemoveButton(productName).waitFor({ state: 'visible' });
  }

  async removeProductFromCart(productName: string): Promise<void> {
    await this.getRemoveButton(productName).click();
    await this.getAddToCartButton(productName).waitFor({ state: 'visible' });
  }

  async addProductsToCart(productNames: readonly string[]): Promise<void> {
    for (const productName of productNames) {
      await this.addProductToCart(productName);
    }
  }

  async sortProductsBy(sortOption: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(sortOption.value);
  }

  async openCart(): Promise<void> {
    await this.header.openCart();
  }

  // ---- Readers, for validators that need computed values rather than locators ----

  async readProductNames(): Promise<string[]> {
    return this.productNames.allInnerTexts();
  }

  async readProductPrices(): Promise<number[]> {
    return (await this.productPrices.allInnerTexts()).map(parsePrice);
  }

  /** Prices exactly as rendered, so the money format can be asserted. */
  async readRenderedProductPrices(): Promise<string[]> {
    return this.productPrices.allInnerTexts();
  }
}
