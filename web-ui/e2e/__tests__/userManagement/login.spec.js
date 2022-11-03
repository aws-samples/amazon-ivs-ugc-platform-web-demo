// @ts-check
const { expect } = require('@playwright/test');

const { LoginPageModel } = require('../../models');
const { extendTestFixtures } = require('../../utils');

const test = extendTestFixtures(
  [{ name: 'loginPage', PageModel: LoginPageModel }],
  { isAuthenticated: false }
);

test.describe('Login Page', () => {
  test.describe('General Cases', () => {
    test('should login a user and check that an authenticated user cannot navigate to the login page', async ({
      loginPage: { login },
      page
    }) => {
      await login('testUser', 'Passw0rd!');
      await page.takeScreenshot('user-login');
      await page.assertResponses([
        ['/', 200], // Cognito authenticate user
        ['/user', 500], // Get user data (first call fails as user resources have not been created)
        ['/user/resources/create', 200], // Create user resources
        ['/user', 200] // Get user data
      ]);

      // Ensure that navigating back after logging in does not redirect the user back to the login page
      await page.goBack();
      await expect(page).not.toHaveURL('/login');
    });

    test('should logout a user', async ({
      loginPage: { logout },
      page,
      isMobile,
      browserName
    }) => {
      await logout(isMobile);
      await page.takeScreenshot('logout-success');
    });

    test('should navigate a user to the password reset page', async ({
      loginPage: { gotoForgotPassword },
      page
    }) => {
      await gotoForgotPassword();
      await page.takeScreenshot('goto-forgot-password');
    });

    test('should navigate a user to the registration page', async ({
      loginPage: { gotoCreateAnAccount },
      page
    }) => {
      await gotoCreateAnAccount();
      await page.takeScreenshot('goto-create-an-account');
    });
  });
});
