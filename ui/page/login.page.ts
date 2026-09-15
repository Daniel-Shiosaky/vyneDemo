import type { Locator, Page } from '@playwright/test';

import type { LoginCredentials } from '@ui/types/user.interface';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly path = '/';

  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;
  private readonly errorDismissButton: Locator;

  constructor(page: Page) {
    super(page);
    // The login form is not labelled, so placeholders are the most user-facing option here.
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error');
    this.errorDismissButton = page.locator('.error-button');
  }

  // ---- Locator getters, for the validator layer ----

  getUsernameInput(): Locator {
    return this.usernameInput;
  }

  getPasswordInput(): Locator {
    return this.passwordInput;
  }

  getLoginButton(): Locator {
    return this.loginButton;
  }

  getErrorMessage(): Locator {
    return this.errorMessage;
  }

  // ---- Actions ----

  async waitUntilReady(): Promise<void> {
    await this.loginButton.waitFor({ state: 'visible' });
  }

  /** Fills the form and submits. Does not wait for success, so negative cases work too. */
  async login(loginCredentials: LoginCredentials): Promise<void> {
    await this.usernameInput.fill(loginCredentials.username);
    await this.passwordInput.fill(loginCredentials.password);
    await this.loginButton.click();
  }

  async enterUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  async dismissError(): Promise<void> {
    await this.errorDismissButton.click();
  }
}
