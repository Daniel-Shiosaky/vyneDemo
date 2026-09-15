import { expect } from '@playwright/test';

import type { LoginPage } from '@ui/page/login.page';

/**
 * Assertions for the login page.
 *
 * Layer rule: this class owns every `expect()` for login and declares no locators of its own —
 * it reaches elements only through `LoginPage` getters.
 */
export class LoginValidator {
  constructor(private readonly loginPage: LoginPage) {}

  /** The login form is displayed and empty — the state after signing out. */
  async verifyLoginPageIsDisplayed(): Promise<void> {
    await expect(this.loginPage.getLoginButton()).toBeVisible();
    await expect(this.loginPage.getUsernameInput()).toBeEmpty();
  }

  /** Reused by every rejection case in the login journey. */
  async verifyLoginWasRejectedWith(expectedMessage: string): Promise<void> {
    await expect(this.loginPage.getErrorMessage()).toHaveText(expectedMessage);
    // The user must still be on the login page, not part-way into the app.
    expect(this.loginPage.getUrl()).not.toContain('/inventory.html');
  }
}
