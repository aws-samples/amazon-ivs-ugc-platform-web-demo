// @ts-check
const { RegisterPageModel } = require('../../models');
const { extendTestFixtures } = require('../../utils');

const test = extendTestFixtures(
  [{ name: 'registerPage', PageModel: RegisterPageModel }],
  { isAuthenticated: false }
);

test.describe('Register Page', () => {
  test.describe('General Cases', () => {
    test('should register a new user account with email verification', async ({
      registerPage: {
        navigate,
        createAccount,
        resendEmailVerification,
        confirmUser
      },
      page
    }) => {
      const expectedResponses = [];

      // Create a new account by clicking and filling all the inputs in the registration form
      await createAccount('testUser', 'testuser@ugc.com', 'Passw0rd!');
      await page.takeScreenshot('new-user-registration-complete');
      expectedResponses.push(['/channel/register', 200]); // Register a new user account
      await page.assertResponses(expectedResponses);

      // Resend the account verification email to the new user
      await resendEmailVerification();
      // Wait for the success notification to render and stabilize before taking a screenshot
      await (
        await page.waitForSelector('.notification')
      ).waitForElementState('stable');
      await page.takeScreenshot('resend-email-verification-success');
      expectedResponses.push(['/', 200]); // Cognito resend confirmation code
      await page.assertResponses(expectedResponses);

      // Navigate to the link found in the verification email to confirm the new user account
      await confirmUser(123456, 'testUser');
      expectedResponses.push(['/', 200]); // Cognito confirm registration
      await page.assertResponses(expectedResponses);

      // Wait for the success notification to render and stabilize before taking a screenshot
      await (
        await page.waitForSelector('.notification')
      ).waitForElementState('stable');
      await page.takeScreenshot('new-user-account-confirmed');
    });

    test('should navigate a user to the login page', async ({
      registerPage: { gotoSignIn },
      page
    }) => {
      await gotoSignIn();
      await page.takeScreenshot('goto-user-login');
    });
  });
});
