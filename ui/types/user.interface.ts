/** A SauceDemo account, as used by the login page and by `auth.setup.ts`. */
export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
}

/**
 * The accounts this suite drives. Keys name the storageState files `auth.setup.ts` produces, so
 * they must stay filesystem-safe.
 */
export type UserRole = 'standard' | 'lockedOut';
