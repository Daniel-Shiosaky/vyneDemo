import type { Product, SortOption } from '@ui/types/product.interface';

/** The SauceDemo catalog, captured from the live application on 2026-09-15. */
export const PRODUCTS = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99, catalogId: 4 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99, catalogId: 0 },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99, catalogId: 1 },
  fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99, catalogId: 5 },
  onesie: { name: 'Sauce Labs Onesie', price: 7.99, catalogId: 2 },
  /** Note the dots and parentheses - this name stress-tests locator slugging. */
  redTShirt: { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99, catalogId: 3 },
} as const satisfies Record<string, Product>;

export const ALL_PRODUCTS: readonly Product[] = Object.values(PRODUCTS);

export const EXPECTED_PRODUCT_COUNT = ALL_PRODUCTS.length;

/** The four sort modes offered by the catalog's dropdown. */
export const SORT_OPTIONS = {
  nameAscending: { value: 'az', label: 'Name (A to Z)', sortBy: 'name', direction: 'ascending' },
  nameDescending: { value: 'za', label: 'Name (Z to A)', sortBy: 'name', direction: 'descending' },
  priceAscending: {
    value: 'lohi',
    label: 'Price (low to high)',
    sortBy: 'price',
    direction: 'ascending',
  },
  priceDescending: {
    value: 'hilo',
    label: 'Price (high to low)',
    sortBy: 'price',
    direction: 'descending',
  },
} as const satisfies Record<string, SortOption>;

export const ALL_SORT_OPTIONS: readonly SortOption[] = Object.values(SORT_OPTIONS);
