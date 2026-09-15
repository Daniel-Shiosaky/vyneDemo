import { LOGIN_ERROR } from '@ui/data/const/message.const';
import {
  USERS,
  credentialsForUnknownUser,
  credentialsWithIncorrectPassword,
  credentialsWithoutUsername,
} from '@ui/data/const/user.const';
import { test } from '@ui/fixtures';
import { SIGNED_OUT } from '@ui/util/auth.util';

/**
 * E2E journey: signing in and signing out.
 *
 * These are the only specs that drive the login form. Every other journey starts from the saved
 * session created by auth.setup.ts, so the login UI is exercised here and nowhere else.
 */
test.use({ storageState: SIGNED_OUT });

test.describe('E2E: Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('Verify user can log in with valid credentials and log back out', async ({
    loginPage,
    inventoryPage,
    inventoryValidator,
    loginValidator,
  }) => {
    await loginPage.login(USERS.standard());
    await inventoryPage.waitUntilReady();

    await inventoryValidator.verifyCatalogIsDisplayed();

    // Signing out completes the session lifecycle and returns the user to the form.
    await inventoryPage.getHeader().logout();
    await loginPage.waitUntilReady();

    await loginValidator.verifyLoginPageIsDisplayed();
  });

  /**
   * Every way the app refuses a sign-in. Data-driven rather than one test per case: the journey
   * is identical, only the credentials and the expected message differ.
   */
  const rejectedLoginCases = [
    {
      description: 'a locked out user',
      buildCredentials: USERS.lockedOut,
      expectedMessage: LOGIN_ERROR.lockedOut,
    },
    {
      description: 'an incorrect password',
      buildCredentials: credentialsWithIncorrectPassword,
      expectedMessage: LOGIN_ERROR.credentialsDoNotMatch,
    },
    {
      // Identical wording to the incorrect-password case, which prevents user enumeration.
      description: 'an unknown username',
      buildCredentials: credentialsForUnknownUser,
      expectedMessage: LOGIN_ERROR.credentialsDoNotMatch,
    },
    {
      description: 'a missing username',
      buildCredentials: credentialsWithoutUsername,
      expectedMessage: LOGIN_ERROR.usernameRequired,
    },
  ];

  for (const rejectedLoginCase of rejectedLoginCases) {
    test(`Verify login is rejected with ${rejectedLoginCase.description}`, async ({
      loginPage,
      loginValidator,
    }) => {
      await loginPage.login(rejectedLoginCase.buildCredentials());

      await loginValidator.verifyLoginWasRejectedWith(rejectedLoginCase.expectedMessage);
    });
  }
});
