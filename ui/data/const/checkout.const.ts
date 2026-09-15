import type { CheckoutDetails } from '@ui/types/checkout.interface';

export const VALID_CHECKOUT_DETAILS: CheckoutDetails = {
  firstName: 'Dana',
  lastName: 'Rivera',
  postalCode: '12345',
};

/**
 * Fixed values the checkout overview always shows, and the tax rate derived from live data:
 * a $37.98 subtotal produced $3.04 tax (37.98 * 0.08 = 3.0384).
 */
export const CHECKOUT = {
  paymentInformation: 'SauceCard #31337',
  shippingInformation: 'Free Pony Express Delivery!',
  taxRate: 0.08,
} as const;

/** Page titles, used to confirm navigation landed where it should. */
export const PAGE_TITLE = {
  products: 'Products',
  cart: 'Your Cart',
  checkoutInformation: 'Checkout: Your Information',
  checkoutOverview: 'Checkout: Overview',
  checkoutComplete: 'Checkout: Complete!',
} as const;

/**
 * Every amount the app renders must match this: a dollar sign and exactly two decimal places.
 *
 * Verified live on a two-item order — item prices `$29.99` / `$7.99`, `Item total: $37.98`,
 * `Tax: $3.04`, `Total: $41.02`.
 */
export const MONEY_FORMAT = /^\$\d+\.\d{2}$/;

/** Extracts the amount from a prefixed label such as `Item total: $37.98`. */
export const MONEY_IN_LABEL = /\$\d+(?:\.\d+)?/;
