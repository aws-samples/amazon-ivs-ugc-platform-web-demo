// @ts-check
const { ResetPageModel } = require('../models');
const { extendTestFixtures } = require('../utils');

const test = extendTestFixtures(
  [{ name: 'resetPage', PageModel: ResetPageModel }],
  { isAuthenticated: false }
);

test.describe('Reset Page', () => {
  test.describe('General Cases', () => {
    test('should reset a forgotten password by email verification', async ({
      resetPage: {
        sendPasswordResetRequest,
        resendPasswordRequest,
        resetPassword,
        mockPasswordResetRequest,
        username
      },
      page
    }) => {
      const expectedResponses = [];

      await sendPasswordResetRequest('testuser@ugc.com');
      await page.takeScreenshot('reset-password-request-sent');
      expectedResponses.push(['/channel/password/reset', 200]); // Send password reset request email
      await page.assertResponses(expectedResponses);

      // On the password reset confirmation page, attempt to resend the password reset email
      await resendPasswordRequest();
      // Wait for the success notification to render and stabilize before taking a screenshot
      await (
        await page.waitForSelector('.notification')
      ).waitForElementState('stable');
      await page.takeScreenshot('resend-password-reset-email-success');
      expectedResponses.push(['/channel/password/reset', 200]); // Re-send password reset request email
      await page.assertResponses(expectedResponses);

      // Navigate to the link found in the verification email to set a new password
      await resetPassword(123456, username, 'NewPassword0!');
      expectedResponses.push(['/', 200]); // Cognito confirm password
      await page.assertResponses(expectedResponses);
    });

    test('should return a user to the login page from the reset password and request confirmation pages', async ({
      resetPage: { returnToLogin, sendPasswordResetRequest, navigate },
      page
    }) => {
      await returnToLogin();
      await page.takeScreenshot('goto-user-login');

      // Navigate to the password reset confirmation page and check the 'return to login' link there as well
      await navigate(); // go back to "/reset"
      await sendPasswordResetRequest('testuser@ugc.com');
      await returnToLogin();
    });
  });
});
