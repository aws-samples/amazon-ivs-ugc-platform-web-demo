const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const { getCloudfrontURLRegex, COGNITO_IDP_URL_REGEX } = require('../utils');

class ResetPageModel extends BasePageModel {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    super(page, baseURL, '/reset');

    // Locators
    this.emailInputLoc = page.locator('input[id="email"]');
    this.newPasswordInputLoc = page.locator('input[id="newPassword"]');
    this.confirmNewPasswordInputLoc = page.locator(
      'input[id="confirmNewPassword"]'
    );
    this.continueButtonLoc = page.locator('button:has-text("Continue")');
    this.submitNewPasswordButtonLoc = page.locator('button:has-text("Submit")');
    this.returnToLoginLinkLoc = page.locator('a:has-text("Return to login")');
    this.resendPasswordRequestLoc = page.locator('button:has-text("Resend")');
  }

  static create = async (page, baseURL) => {
    const resetPage = new ResetPageModel(page, baseURL);

    await resetPage.init();
    await resetPage.#mockPasswordResetRequest();
    await resetPage.#mockPasswordReset();

    return resetPage;
  };

  /* USER FLOW OPERATIONS */

  sendPasswordResetRequest = async (email) => {
    // Click and fill email input field
    await this.emailInputLoc.click();
    await this.emailInputLoc.fill(email);
    await expect(this.emailInputLoc).toHaveValue(email);

    await this.page.takeScreenshot('forgotten-password-filled-form');

    // Click the "Continue" button
    await this.continueButtonLoc.click();

    const headerLoc = this.page.locator('.sub-page-container h2');
    await expect(headerLoc).toHaveText('Reset your password');
  };

  resetPassword = async (code, username, newPassword) => {
    await this.navigate(`/reset?code=${code}&username=${username}`);

    const headerLoc = this.page.locator('form h1');
    await expect(headerLoc).toHaveText('Reset your password');

    // Click and fill the new password input field
    await this.newPasswordInputLoc.click();
    await this.newPasswordInputLoc.fill(newPassword);
    await expect(this.newPasswordInputLoc).toHaveValue(newPassword);

    // Click and fill the confirm new password input field
    await this.confirmNewPasswordInputLoc.click();
    await this.confirmNewPasswordInputLoc.fill(newPassword);
    await expect(this.confirmNewPasswordInputLoc).toHaveValue(newPassword);

    await this.page.takeScreenshot('new-password-filled-form');

    // Click the "Submit" button and check that we have been redirected to the login page
    // Note: Promise.all prevents a race condition between clicking and waiting for the main frame to navigate
    await Promise.all([
      this.page.waitForNavigation(),
      this.submitNewPasswordButtonLoc.click()
    ]);

    await expect(this.page).toHaveURL('/login');
  };

  resendPasswordRequest = async () => {
    // Click the "Resend" (password reset request) button
    await this.resendPasswordRequestLoc.click();

    const notifLoc = this.page.locator('.notification');
    const notifTestId = await notifLoc.getAttribute('data-test-id');
    await expect(notifTestId).toBe('success-notification');
    await expect(notifLoc).toHaveText('Verification email has been resent');
  };

  returnToLogin = async () => {
    // Click the "Return to login" link
    await this.returnToLoginLinkLoc.click();
    await expect(this.page).toHaveURL(this.baseURL + '/login');
  };

  /* MOCK API HELPERS (INTERNAL) */

  #mockPasswordResetRequest = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel/password/reset'),
      (route, request) => {
        if (request.method() === 'POST') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({})
          });
        } else route.continue();
      }
    );
  };

  #mockPasswordReset = async () => {
    await this.page.route(COGNITO_IDP_URL_REGEX, (route, request) => {
      if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({})
        });
      }
    });
  };
}

module.exports = ResetPageModel;
