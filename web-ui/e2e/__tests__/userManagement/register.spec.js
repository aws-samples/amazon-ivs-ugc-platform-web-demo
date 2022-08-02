// @ts-check
const { expect } = require('@playwright/test');

const { RegisterPageModel } = require('../../models');
const { extendTestFixtures } = require('../../utils');

const test = extendTestFixtures(
  {
    registerPage: async ({ page, baseURL }, use) => {
      const registerPage = await RegisterPageModel.create(page, baseURL);
      await use(registerPage);
    }
  },
  { isAuthenticated: false }
);

test.describe('Register Page', () => {
  test.beforeEach(({ page }) => {
    page.addAPIResponseEventListener();
  });
  test.afterEach(({ page }) => {
    page.removeAPIResponseEventListener();
  });

  test.fixme(
    'should register a new user',
    async ({
      registerPage: {
        navigate,
        createAccount,
        resendEmailVerification,
        confirmUser
      },
      page
    }) => {
      // Create a new account by clicking and filling all the inputs in the registration form
      await createAccount('testUser', 'testuser@ugc.com', 'Passw0rd!');
      await page.takeScreenshot('new-user-registration-complete');
      await expect
        .poll(() => page.fetchResponses?.length, { timeout: 2000 })
        .toEqual(1);

      // Resend the account verification email to the new user
      await resendEmailVerification();
      // Wait for the success notification to render and stabilize before taking a screenshot
      await (
        await page.waitForSelector('.notification')
      ).waitForElementState('stable');
      await page.takeScreenshot('resend-email-verification-success');
      await expect
        .poll(() => page.fetchResponses?.length, { timeout: 2000 })
        .toEqual(2);

      // Navigate to the link found in the verification email to confirm the new user account
      await confirmUser(123456, 'testUser');
      await expect
        .poll(() => page.fetchResponses?.length, { timeout: 2000 })
        .toEqual(3);
      // Wait for the success notification to render and stabilize before taking a screenshot
      await (
        await page.waitForSelector('.notification')
      ).waitForElementState('stable');
      await page.takeScreenshot('new-user-account-confirmed');
    }
  );

  test.fixme(
    'should navigate a user to the login page',
    async ({ registerPage: { gotoSignIn }, page }) => {
      await gotoSignIn();
      await page.takeScreenshot('goto-user-login');
    }
  );
});
