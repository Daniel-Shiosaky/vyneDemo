import type { Locator, Page } from '@playwright/test';

import type { CheckoutDetails } from '@ui/types/checkout.interface';
import { BasePage } from './base.page';
import { HeaderComponent } from './header.component';

/** Checkout step one: buyer information. */
export class CheckoutInformationPage extends BasePage {
  readonly path = '/checkout-step-one.html';

  private readonly header: HeaderComponent;
  private readonly title: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly postalCodeInput: Locator;
  private readonly continueButton: Locator;
  private readonly cancelButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.postalCodeInput = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.errorMessage = page.getByTestId('error');
  }

  // ---- Locator getters, for the validator layer ----

  getHeader(): HeaderComponent {
    return this.header;
  }

  getTitle(): Locator {
    return this.title;
  }

  getErrorMessage(): Locator {
    return this.errorMessage;
  }

  // ---- Actions ----

  async waitUntilReady(): Promise<void> {
    await this.firstNameInput.waitFor({ state: 'visible' });
  }

  /** Fills only the fields provided, so validation cases can submit partial forms. */
  async enterBuyerDetails(details: Partial<CheckoutDetails>): Promise<void> {
    if (details.firstName !== undefined) await this.firstNameInput.fill(details.firstName);
    if (details.lastName !== undefined) await this.lastNameInput.fill(details.lastName);
    if (details.postalCode !== undefined) await this.postalCodeInput.fill(details.postalCode);
  }

  async clickContinue(): Promise<void> {
    await this.continueButton.click();
  }

  /** Fills the whole form and advances. */
  async submitBuyerDetails(details: CheckoutDetails): Promise<void> {
    await this.enterBuyerDetails(details);
    await this.clickContinue();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
