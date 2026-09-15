import type { Locator, Page } from '@playwright/test';

import type { CartLineItem } from '@ui/types/product.interface';
import { parsePrice, toProductSlug } from '@ui/util/price.util';
import { BasePage } from './base.page';
import { HeaderComponent } from './header.component';

export class CartPage extends BasePage {
  readonly path = '/cart.html';

  private readonly header: HeaderComponent;
  private readonly title: Locator;
  private readonly cartList: Locator;
  private readonly cartLineItems: Locator;
  private readonly productNames: Locator;
  private readonly quantityLabels: Locator;
  private readonly checkoutButton: Locator;
  private readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.cartList = page.getByTestId('cart-list');
    this.cartLineItems = page.getByTestId('inventory-item');
    this.productNames = page.getByTestId('inventory-item-name');
    this.quantityLabels = page.getByTestId('item-quantity');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
  }

  // ---- Locator getters, for the validator layer ----

  getHeader(): HeaderComponent {
    return this.header;
  }

  getTitle(): Locator {
    return this.title;
  }

  getCartLineItems(): Locator {
    return this.cartLineItems;
  }

  getQuantityLabels(): Locator {
    return this.quantityLabels;
  }

  getCheckoutButton(): Locator {
    return this.checkoutButton;
  }

  getLineItemFor(productName: string): Locator {
    return this.cartLineItems.filter({ hasText: productName });
  }

  getRemoveButton(productName: string): Locator {
    return this.page.getByTestId(`remove-${toProductSlug(productName)}`);
  }

  // ---- Actions ----

  /** `cart-list` renders even when empty, so it is safe for both populated and empty carts. */
  async waitUntilReady(): Promise<void> {
    await this.cartList.waitFor({ state: 'visible' });
  }

  async removeProduct(productName: string): Promise<void> {
    await this.getRemoveButton(productName).click();
    // The row disappearing is the signal the removal took effect.
    await this.getLineItemFor(productName).waitFor({ state: 'detached' });
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  // ---- Readers ----

  async readProductNames(): Promise<string[]> {
    return this.productNames.allInnerTexts();
  }

  /** Every line item, so a validator can assert cart contents in one comparison. */
  async readLineItems(): Promise<CartLineItem[]> {
    const lineItemRows = await this.cartLineItems.all();
    const lineItems: CartLineItem[] = [];

    for (const lineItemRow of lineItemRows) {
      lineItems.push({
        name: (await lineItemRow.getByTestId('inventory-item-name').innerText()).trim(),
        price: parsePrice(await lineItemRow.getByTestId('inventory-item-price').innerText()),
        quantity: Number.parseInt(
          (await lineItemRow.getByTestId('item-quantity').innerText()).trim(),
          10,
        ),
      });
    }
    return lineItems;
  }

  /** Product prices exactly as rendered, for asserting the money format. */
  async readRenderedProductPrices(): Promise<string[]> {
    return this.cartLineItems.getByTestId('inventory-item-price').allInnerTexts();
  }
}
