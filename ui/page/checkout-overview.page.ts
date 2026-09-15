import type { Locator, Page } from '@playwright/test';

import type { OrderTotals } from '@ui/types/product.interface';
import { parsePrice } from '@ui/util/price.util';
import { BasePage } from './base.page';
import { HeaderComponent } from './header.component';

/** Checkout step two: order overview with the money breakdown. */
export class CheckoutOverviewPage extends BasePage {
  readonly path = '/checkout-step-two.html';

  private readonly header: HeaderComponent;
  private readonly title: Locator;
  private readonly orderedProductCards: Locator;
  private readonly productNames: Locator;
  private readonly productPrices: Locator;
  private readonly paymentInformation: Locator;
  private readonly shippingInformation: Locator;
  private readonly subtotalLabel: Locator;
  private readonly taxLabel: Locator;
  private readonly totalLabel: Locator;
  private readonly finishButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.orderedProductCards = page.getByTestId('inventory-item');
    this.productNames = page.getByTestId('inventory-item-name');
    this.productPrices = page.getByTestId('inventory-item-price');
    this.paymentInformation = page.getByTestId('payment-info-value');
    this.shippingInformation = page.getByTestId('shipping-info-value');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  // ---- Locator getters, for the validator layer ----

  getHeader(): HeaderComponent {
    return this.header;
  }

  getTitle(): Locator {
    return this.title;
  }

  getOrderedProductCards(): Locator {
    return this.orderedProductCards;
  }

  getPaymentInformation(): Locator {
    return this.paymentInformation;
  }

  getShippingInformation(): Locator {
    return this.shippingInformation;
  }

  getSubtotalLabel(): Locator {
    return this.subtotalLabel;
  }

  getTaxLabel(): Locator {
    return this.taxLabel;
  }

  getTotalLabel(): Locator {
    return this.totalLabel;
  }

  // ---- Actions ----

  /** `finish` is unique to this step and present even when the cart is empty. */
  async waitUntilReady(): Promise<void> {
    await this.finishButton.waitFor({ state: 'visible' });
  }

  async finishOrder(): Promise<void> {
    await this.finishButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  // ---- Readers ----

  async readProductNames(): Promise<string[]> {
    return this.productNames.allInnerTexts();
  }

  async readProductPrices(): Promise<number[]> {
    return (await this.productPrices.allInnerTexts()).map(parsePrice);
  }

  /** Product prices exactly as rendered, for asserting the money format. */
  async readRenderedProductPrices(): Promise<string[]> {
    return this.productPrices.allInnerTexts();
  }

  /**
   * The three money labels exactly as rendered, e.g. `Item total: $37.98`.
   * Returned raw so a validator can assert both the amount and its formatting.
   */
  async readRenderedTotalLabels(): Promise<{ subtotal: string; tax: string; total: string }> {
    return {
      subtotal: (await this.subtotalLabel.innerText()).trim(),
      tax: (await this.taxLabel.innerText()).trim(),
      total: (await this.totalLabel.innerText()).trim(),
    };
  }

  /** The three money figures, parsed from their prefixed labels. */
  async readTotals(): Promise<OrderTotals> {
    return {
      subtotal: parsePrice(await this.subtotalLabel.innerText()),
      tax: parsePrice(await this.taxLabel.innerText()),
      total: parsePrice(await this.totalLabel.innerText()),
    };
  }
}
