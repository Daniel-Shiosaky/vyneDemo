import { expect, type Download } from '@playwright/test';
import fs from 'node:fs';

import { CHECKOUT, MONEY_FORMAT, MONEY_IN_LABEL, PAGE_TITLE } from '@ui/data/const/checkout.const';
import { ORDER_CONFIRMATION } from '@ui/data/const/message.const';
import type { CheckoutCompletePage } from '@ui/page/checkout-complete.page';
import type { CheckoutInformationPage } from '@ui/page/checkout-information.page';
import type { CheckoutOverviewPage } from '@ui/page/checkout-overview.page';
import type { CheckoutDetails } from '@ui/types/checkout.interface';
import type { Product } from '@ui/types/product.interface';
import { extractPdfText, isValidPdf } from '@ui/util/pdf.util';
import { calculateTotals, formatPrice } from '@ui/util/price.util';

/** Assertions across the three checkout steps, the confirmation, and the PDF receipt. */
export class CheckoutValidator {
  constructor(
    private readonly informationPage: CheckoutInformationPage,
    private readonly overviewPage: CheckoutOverviewPage,
    private readonly completePage: CheckoutCompletePage,
  ) {}

  async verifyInformationStepIsDisplayed(): Promise<void> {
    await expect(this.informationPage.getTitle()).toHaveText(PAGE_TITLE.checkoutInformation);
  }

  async verifyOverviewIsDisplayed(): Promise<void> {
    await expect(this.overviewPage.getTitle()).toHaveText(PAGE_TITLE.checkoutOverview);
  }

  /** The overview lists exactly the products ordered, each at its catalog price. */
  async verifyOrderedProducts(expectedProducts: readonly Product[]): Promise<void> {
    await expect(this.overviewPage.getOrderedProductCards()).toHaveCount(expectedProducts.length);

    expect((await this.overviewPage.readProductNames()).sort()).toEqual(
      expectedProducts.map((product) => product.name).sort(),
    );
    expect((await this.overviewPage.readProductPrices()).sort()).toEqual(
      expectedProducts.map((product) => product.price).sort(),
    );
  }

  /**
   * Subtotal is the sum of the ordered prices, tax is 8% of subtotal, total is subtotal + tax.
   *
   * Expected figures are derived from the products the test actually ordered rather than
   * hard-coded, so this holds if catalog prices change. The internal relationship is asserted
   * separately so the maths is checked independently of the expected values.
   */
  async verifyOrderTotals(expectedProducts: readonly Product[]): Promise<void> {
    const expectedTotals = calculateTotals(expectedProducts.map((product) => product.price));
    const displayedTotals = await this.overviewPage.readTotals();

    expect(displayedTotals.subtotal).toBeCloseTo(expectedTotals.subtotal, 2);
    expect(displayedTotals.tax).toBeCloseTo(expectedTotals.tax, 2);
    expect(displayedTotals.total).toBeCloseTo(expectedTotals.total, 2);

    expect(displayedTotals.total).toBeCloseTo(displayedTotals.subtotal + displayedTotals.tax, 2);
    expect(displayedTotals.tax).toBeCloseTo(displayedTotals.subtotal * CHECKOUT.taxRate, 2);
  }

  /**
   * Every amount on the overview — each product price and all three totals — is rendered with a
   * dollar sign and exactly two decimal places.
   *
   * The totals arrive inside prefixed labels ("Item total: $37.98"), so the amount is extracted
   * before being format-checked.
   */
  async verifyAmountsUseMoneyFormat(): Promise<void> {
    for (const renderedPrice of await this.overviewPage.readRenderedProductPrices()) {
      expect(renderedPrice, `product price "${renderedPrice}"`).toMatch(MONEY_FORMAT);
    }

    const renderedLabels = await this.overviewPage.readRenderedTotalLabels();
    for (const [labelName, renderedLabel] of Object.entries(renderedLabels)) {
      const amountMatch = renderedLabel.match(MONEY_IN_LABEL);
      expect(
        amountMatch,
        `no amount found in ${labelName} label "${renderedLabel}"`,
      ).not.toBeNull();
      expect(amountMatch?.[0], `${labelName} amount in "${renderedLabel}"`).toMatch(MONEY_FORMAT);
    }
  }

  async verifyPaymentAndShippingInformation(): Promise<void> {
    await expect(this.overviewPage.getPaymentInformation()).toHaveText(CHECKOUT.paymentInformation);
    await expect(this.overviewPage.getShippingInformation()).toHaveText(
      CHECKOUT.shippingInformation,
    );
  }

  /** The order was accepted: confirmation copy on screen and the cart emptied. */
  async verifyOrderIsConfirmed(): Promise<void> {
    await expect(this.completePage.getTitle()).toHaveText(PAGE_TITLE.checkoutComplete);
    await expect(this.completePage.getConfirmationHeader()).toHaveText(ORDER_CONFIRMATION.header);
    await expect(this.completePage.getConfirmationText()).toHaveText(ORDER_CONFIRMATION.text);
    await expect(this.completePage.getPonyExpressImage()).toBeVisible();
    // Final state: placing the order clears the cart.
    await expect(this.completePage.getHeader().getCartBadge()).toHaveCount(0);
  }

  /**
   * The generated PDF is a real receipt for this order.
   *
   * Asserts the outcome that matters — the file is a structurally valid PDF and its text lists
   * the products ordered, their prices, the correct totals and the buyer's shipping details.
   * Layout, fonts and byte size are implementation details and are not asserted.
   */
  async verifyOrderReceiptPdf(
    download: Download,
    orderedProducts: readonly Product[],
    buyerDetails: CheckoutDetails,
  ): Promise<void> {
    expect(download.suggestedFilename()).toMatch(/^swag-labs-order-.*\.pdf$/);

    const downloadedPath = await download.path();
    expect(downloadedPath, 'the PDF did not land on disk').toBeTruthy();

    const pdfBuffer = fs.readFileSync(downloadedPath as string);
    expect(isValidPdf(pdfBuffer), 'downloaded file is not a structurally valid PDF').toBe(true);

    const receiptText = extractPdfText(pdfBuffer);
    expect(receiptText.length, 'no text could be read from the receipt').toBeGreaterThan(0);

    for (const orderedProduct of orderedProducts) {
      expect(receiptText, `receipt is missing "${orderedProduct.name}"`).toContain(
        orderedProduct.name,
      );
      expect(receiptText, `receipt is missing the price of "${orderedProduct.name}"`).toContain(
        formatPrice(orderedProduct.price),
      );
    }

    const expectedTotals = calculateTotals(orderedProducts.map((product) => product.price));
    expect(receiptText, 'receipt is missing the item total').toContain(
      formatPrice(expectedTotals.subtotal),
    );
    expect(receiptText, 'receipt is missing the tax').toContain(formatPrice(expectedTotals.tax));
    expect(receiptText, 'receipt is missing the order total').toContain(
      formatPrice(expectedTotals.total),
    );

    expect(receiptText, 'receipt is missing the buyer name').toContain(
      `${buyerDetails.firstName} ${buyerDetails.lastName}`,
    );
    expect(receiptText, 'receipt is missing the postal code').toContain(buyerDetails.postalCode);
  }

  /**
   * 🐞 Characterises a defect: an empty cart produces a confirmed $0 order
   * (docs/EXPLORATION-FINDINGS.md 1.10 #1). A real store must reject an empty basket at the
   * Checkout button.
   *
   * Also pins the formatting inconsistency on the same screen — the subtotal renders "$0" while
   * tax and total render "$0.00" — which is why the money-format check runs only on real orders.
   */
  async verifyEmptyOrderIsAccepted(): Promise<void> {
    await expect(this.overviewPage.getOrderedProductCards()).toHaveCount(0);

    const displayedTotals = await this.overviewPage.readTotals();
    expect(displayedTotals.subtotal).toBe(0);
    expect(displayedTotals.tax).toBe(0);
    expect(displayedTotals.total).toBe(0);

    const renderedLabels = await this.overviewPage.readRenderedTotalLabels();
    expect(renderedLabels.subtotal).toBe('Item total: $0');
    expect(renderedLabels.tax).toBe('Tax: $0.00');
    expect(renderedLabels.total).toBe('Total: $0.00');
  }
}
