// @ts-check
const { expect } = require('@playwright/test');

const { ResetPageModel } = require('../../models');
const { extendTestFixtures } = require('../../utils');

const test = extendTestFixtures(
  {
    resetPage: async ({ page, baseURL }, use) => {
      const resetPage = await ResetPageModel.create(page, baseURL);
      await use(resetPage);
    }
  },
  { isAuthenticated: false }
);

test.describe('Reset Page', () => {
  test.beforeEach(({ page }) => {
    page.addAPIResponseEventListener();
  });
  test.afterEach(({ page }) => {
    page.removeAPIResponseEventListener();
  });

  test.fixme(
    'should reset a forgotten password',
    async ({
      resetPage: {
        sendPasswordResetRequest,
        resendPasswordRequest,
        resetPassword,
        mockPasswordResetRequest
      },
      page
    }) => {
      await sendPasswordResetRequest('testuser@ugc.com');
      await expect
        .poll(() => page.fetchResponses?.length, { timeout: 2000 })
        .toEqual(1);
      await page.takeScreenshot('reset-password-request-sent');

      // On the password reset confirmation page, attempt to resend the password reset email
      await resendPasswordRequest();
      // Wait for the success notification to render and stabilize before taking a screenshot
      await (
        await page.waitForSelector('.notification')
      ).waitForElementState('stable');
      await page.takeScreenshot('resend-password-reset-email-success');
      await expect
        .poll(() => page.fetchResponses?.length, { timeout: 2000 })
        .toEqual(2);

      // Navigate to the link found in the verification email to set a new password
      await resetPassword(123456, 'testUser', 'NewPassword0!');
      await expect
        .poll(() => page.fetchResponses?.length, { timeout: 2000 })
        .toEqual(3);
    }
  );

  test.fixme(
    'should return a user to the login page',
    async ({
      resetPage: { returnToLogin, sendPasswordResetRequest, navigate },
      page
    }) => {
      await returnToLogin();
      await page.takeScreenshot('goto-user-login');

      // Navigate to the password reset confirmation page and check the 'return to login' link there as well
      await navigate(); // go back to "/reset"
      await sendPasswordResetRequest('testuser@ugc.com');
      await returnToLogin();
    }
  );
});
