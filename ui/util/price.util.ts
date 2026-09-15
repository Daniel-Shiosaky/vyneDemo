import { CHECKOUT } from '@ui/data/const/checkout.const';
import type { OrderTotals } from '@ui/types/product.interface';

/** Formats a number the way the app renders prices, e.g. 29.99 -> "$29.99". */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Parses a rendered price into a number, e.g. "Item total: $37.98" -> 37.98.
 *
 * Tolerant of surrounding label text on purpose: the app prefixes its money labels, and
 * formats an empty-cart subtotal as "$0" while tax and total use "$0.00" - so these values
 * must be parsed, never string-compared.
 */
export function parsePrice(renderedPrice: string): number {
  const parsedAmount = Number.parseFloat(renderedPrice.replace(/[^0-9.]/g, ''));
  if (Number.isNaN(parsedAmount)) {
    throw new Error(`Could not parse a price from "${renderedPrice}"`);
  }
  return parsedAmount;
}

/**
 * Computes the figures the checkout overview should display for a given set of prices.
 * Mirrors the app: tax is 8% of subtotal rounded to cents, total is subtotal + tax.
 *
 * Used so specs assert against their own data rather than hard-coded totals.
 */
export function calculateTotals(productPrices: readonly number[]): OrderTotals {
  const subtotal = roundToCents(
    productPrices.reduce((runningTotal, productPrice) => runningTotal + productPrice, 0),
  );
  const tax = roundToCents(subtotal * CHECKOUT.taxRate);
  return { subtotal, tax, total: roundToCents(subtotal + tax) };
}

function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Converts a product name into the slug SauceDemo embeds in its `data-test` attributes,
 * e.g. "Test.allTheThings() T-Shirt (Red)" -> "test.allthethings()-t-shirt-(red)".
 *
 * Verified against every catalog product: the app lowercases and replaces spaces with
 * hyphens but preserves dots and parentheses. Centralised here so it is done identically
 * everywhere.
 */
export function toProductSlug(productName: string): string {
  return productName.toLowerCase().replace(/\s+/g, '-');
}
