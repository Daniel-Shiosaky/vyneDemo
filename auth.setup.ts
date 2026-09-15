import fs from 'node:fs';

import { test as setup } from '@playwright/test';

import { AUTH_STATE_DIR } from '@shared/const/env.const';
import { AUTHENTICATABLE_ROLES, USERS } from '@ui/data/const/user.const';
import { InventoryPage } from '@ui/page/inventory.page';
import { LoginPage } from '@ui/page/login.page';
import { authStatePath } from '@ui/util/auth.util';

/**
 * Logs in once per usable account and saves each session to `.auth/<role>.json`.
 *
 * Why a setup PROJECT rather than `globalSetup`: `globalSetup` receives every project defined
 * in the config, not the ones actually selected, so it cannot tell an API-only run from a UI
 * run. That meant `npm run test:api` launched a browser and demanded SauceDemo credentials it
 * does not need. A setup project wired through `dependencies` runs only when a UI project runs.
 *
 * It also inherits `use.testIdAttribute` from the config, which a manually-launched browser in
 * `globalSetup` does not.
 *
 * SauceDemo has no login API, so a UI login is the only way to get a session. Doing it here
 * removes ~150 redundant logins from a full run and leaves the login UI exercised only by the
 * specs whose purpose is testing login.
 *
 * The session is a single `session-username` cookie. The cart lives in sessionStorage, which
 * storageState does NOT capture - so every test still starts with an empty cart and isolation
 * is preserved.
 *
 * `lockedOut` is deliberately absent: its login always fails, so it can never hold a session.
 */
setup.beforeAll(() => {
  fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
});

for (const role of AUTHENTICATABLE_ROLES) {
  setup(`authenticate ${role}`, async ({ page, context }) => {
    // performance_glitch_user takes ~5.4s to log in, so allow headroom.
    setup.slow();

    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.open();
    await loginPage.login(USERS[role]());

    // Reaching the product list is the proof the session is valid.
    await inventoryPage.waitUntilReady();

    await context.storageState({ path: authStatePath(role) });
  });
}
