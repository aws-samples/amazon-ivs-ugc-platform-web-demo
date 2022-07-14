// @ts-check
const { expect } = require('@playwright/test');

const { LoginPageModel } = require('../../models');
const { extendTestFixtures } = require('../../utils');

const test = extendTestFixtures(
  {
    loginPage: async ({ page, baseURL }, use) => {
      const loginPage = await LoginPageModel.create(page, baseURL);
      await use(loginPage);
    }
  },
  { isAuthenticated: false }
);

test.describe('Login Page', () => {
  test.beforeEach(({ page }) => {
    page.addAPIResponseEventListener();
  });
  test.afterEach(({ page }) => {
    page.removeAPIResponseEventListener();
  });

  test('should login a new user', async ({ loginPage: { login }, page }) => {
    await login('testUser', 'Passw0rd!');
    await page.takeScreenshot('user-login');
    await expect
      .poll(() => page.fetchResponses?.length, { timeout: 2000 })
      .toEqual(4);

    // Ensure that navigating back after logging in does not redirect the user back to the login page
    await page.goBack();
    await expect(page).not.toHaveURL('/login');
  });

  test('should logout a user', async ({
    loginPage: { logout },
    page
  }, testInfo) => {
    const isMobile = testInfo.project.name.includes('Mobile');
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
