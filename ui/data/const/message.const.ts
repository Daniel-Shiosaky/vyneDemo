/**
 * Every user-facing message this suite asserts on, verified against the live application.
 * Kept in one place so a copy change is a one-line fix rather than a hunt through specs.
 */

/** Login rejection messages (docs/EXPLORATION-FINDINGS.md 1.8). */
export const LOGIN_ERROR = {
  usernameRequired: 'Epic sadface: Username is required',
  /** Deliberately identical for a wrong password and an unknown user - prevents enumeration. */
  credentialsDoNotMatch:
    'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
} as const;

/** Order confirmation copy. */
export const ORDER_CONFIRMATION = {
  header: 'Thank you for your order!',
  text: 'Your order has been dispatched, and will arrive just as fast as the pony can get there!',
} as const;
