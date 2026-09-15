import { ENV } from '@shared/const/env.const';
import type { LoginCredentials, UserRole } from '@ui/types/user.interface';

/**
 * SauceDemo accounts, resolved from `ENV` so no credential is written into source.
 *
 * Functions rather than constants because `ENV` resolves credentials lazily - evaluating them at
 * import time would break the API suite, which needs no SauceDemo credentials.
 */
export const USERS: Record<UserRole, () => LoginCredentials> = {
  /** Fully working. Used by every authenticated journey. */
  standard: () => ({ username: ENV.USERNAME, password: ENV.PASSWORD }),
  /** Login is rejected outright, so this account can never hold a session. */
  lockedOut: () => ({ username: ENV.LOCKED_OUT_USERNAME, password: ENV.PASSWORD }),
};

/**
 * Accounts `auth.setup.ts` creates a saved session for.
 *
 * `lockedOut` is excluded because its login always fails by design - that rejection is asserted
 * in the login journey instead.
 */
export const AUTHENTICATABLE_ROLES: readonly UserRole[] = ['standard'];

/** A password that is wrong by construction. Not a real credential. */
const INCORRECT_PASSWORD = 'definitely_not_the_password';

/** A valid username paired with an incorrect password. */
export const credentialsWithIncorrectPassword = (): LoginCredentials => ({
  username: ENV.USERNAME,
  password: INCORRECT_PASSWORD,
});

/** A username that does not exist. Generated at runtime so nothing looks like a real account. */
export const credentialsForUnknownUser = (): LoginCredentials => ({
  username: `no_such_user_${Date.now()}`,
  password: INCORRECT_PASSWORD,
});

/** A valid password with no username supplied. */
export const credentialsWithoutUsername = (): LoginCredentials => ({
  username: '',
  password: ENV.PASSWORD,
});
