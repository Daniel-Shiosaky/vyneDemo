import path from 'node:path';

import { AUTH_STATE_DIR } from '@shared/const/env.const';
import type { UserRole } from '@ui/types/user.interface';

/**
 * Where the authenticated session for a given account lives on disk.
 *
 * `global-setup.ts` writes these once per run; specs consume them via `test.use({
 * storageState })` so they start already logged in. The directory is gitignored - a session
 * file contains a live cookie and must never be committed.
 */
export function authStatePath(role: UserRole): string {
  return path.join(AUTH_STATE_DIR, `${role}.json`);
}

/**
 * An explicitly empty session, for specs that must start signed out.
 *
 * Use this rather than `storageState: undefined` - `undefined` means "not specified", so the
 * project-level storageState still applies and the test runs authenticated. That silently
 * breaks anything testing the login form or the auth guard.
 */
export const SIGNED_OUT = { cookies: [], origins: [] };
