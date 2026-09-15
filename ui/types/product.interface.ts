/**
 * A SauceDemo catalog product.
 *
 * `catalogId` is the value the app embeds in `item-<id>-title-link` locators and in the
 * `inventory-item.html?id=<n>` URL. It is NOT the display position - the ids are deliberately
 * out of order in the app (docs/EXPLORATION-FINDINGS.md 1.1).
 */
export interface Product {
  readonly name: string;
  readonly price: number;
  readonly catalogId: number;
}

/** A line item as rendered on the cart page. */
export interface CartLineItem {
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

/** The money breakdown shown on the checkout overview. */
export interface OrderTotals {
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
}

/** A sort mode offered by the catalog's dropdown. */
export interface SortOption {
  /** The `<option>` value the app uses, e.g. `az`. */
  readonly value: string;
  /** The label the app echoes into `active-option`, e.g. `Name (A to Z)`. */
  readonly label: string;
  /** Which product field this mode orders by. */
  readonly sortBy: 'name' | 'price';
  readonly direction: 'ascending' | 'descending';
}
