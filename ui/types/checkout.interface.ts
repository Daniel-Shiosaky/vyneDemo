/** Buyer details for the checkout information step. */
export interface CheckoutDetails {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

/** A sort mode offered by the inventory page's dropdown. */
export interface SortOption {
  /** The `<option>` value the app uses, e.g. `az`. */
  readonly value: string;
  /** The label the app echoes back into `active-option`, e.g. `Name (A to Z)`. */
  readonly label: string;
}
