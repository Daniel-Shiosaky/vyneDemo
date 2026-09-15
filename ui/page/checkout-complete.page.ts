import type { Download, Locator, Page } from '@playwright/test';

import { BasePage } from './base.page';
import { HeaderComponent } from './header.component';

/** Order confirmation - the only place a created order is ever readable. */
export class CheckoutCompletePage extends BasePage {
  readonly path = '/checkout-complete.html';

  private readonly header: HeaderComponent;
  private readonly title: Locator;
  private readonly confirmationHeader: Locator;
  private readonly confirmationText: Locator;
  private readonly ponyExpressImage: Locator;
  private readonly backHomeButton: Locator;
  private readonly generatePdfButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.confirmationHeader = page.getByTestId('complete-header');
    this.confirmationText = page.getByTestId('complete-text');
    this.ponyExpressImage = page.getByTestId('pony-express');
    this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
    this.generatePdfButton = page.getByRole('button', { name: 'Generate PDF order' });
  }

  // ---- Locator getters, for the validator layer ----

  getHeader(): HeaderComponent {
    return this.header;
  }

  getTitle(): Locator {
    return this.title;
  }

  getConfirmationHeader(): Locator {
    return this.confirmationHeader;
  }

  getConfirmationText(): Locator {
    return this.confirmationText;
  }

  getPonyExpressImage(): Locator {
    return this.ponyExpressImage;
  }

  // ---- Actions ----

  async waitUntilReady(): Promise<void> {
    await this.confirmationHeader.waitFor({ state: 'visible' });
  }

  async goBackHome(): Promise<void> {
    await this.backHomeButton.click();
  }

  /**
   * Clicks "Generate PDF order" and returns the resulting download. The listener is
   * registered before the click, otherwise the event can fire first and be missed.
   */
  async downloadOrderPdf(): Promise<Download> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.generatePdfButton.click();
    return downloadPromise;
  }
}
