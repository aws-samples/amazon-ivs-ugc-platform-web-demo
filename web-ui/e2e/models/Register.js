const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const { COGNITO_IDP_URL_REGEX, getCloudfrontURLRegex } = require('../utils');

class RegisterPageModel extends BasePageModel {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    super(page, baseURL, '/register');

    // Locators
    this.usernameInputLoc = page.locator('input[id="username"]');
    this.emailInputLoc = page.locator('input[id="email"]');
    this.passwordInputLoc = page.locator('input[id="password"]');
    this.confirmPasswordInputLoc = page.locator('input[id="confirmPassword"]');
    this.createAccountButtonLoc = page.locator(
      'button:has-text("Create account")'
    );
    this.resendVerificationButtonLoc = page.locator(
      'button:has-text("Resend")'
    );
    this.signInLinkLoc = page.locator('a:has-text("Sign in")');
  }

  static create = async (page, baseURL) => {
    const registerPage = new RegisterPageModel(page, baseURL);

    await registerPage.init();
    await registerPage.#mockRegisterUser();
    await registerPage.#mockResendEmailVerification();
    await registerPage.#mockConfirmUser();

    return registerPage;
  };

  /* USER FLOW OPERATIONS */

  createAccount = async (
    username,
    email,
    password,
    confirmPassword = password
  ) => {
    // Click and fill the username input field
    await this.usernameInputLoc.click();
    await this.usernameInputLoc.fill(username);
    await expect(this.usernameInputLoc).toHaveValue(username);

    // Click and fill the email input field
    await this.emailInputLoc.click();
    await this.emailInputLoc.fill(email);
    await expect(this.emailInputLoc).toHaveValue(email);

    // Click and fill the password input field
    await this.passwordInputLoc.click();
    await this.passwordInputLoc.fill(password);
    await expect(this.passwordInputLoc).toHaveValue(password);

    // Click and fill the confirm password input field
    await this.confirmPasswordInputLoc.click();
    await this.confirmPasswordInputLoc.fill(confirmPassword);
    await expect(this.confirmPasswordInputLoc).toHaveValue(confirmPassword);

    await this.page.takeScreenshot('new-user-registration-filled-form');

    // Click the "Create account" button
    await this.createAccountButtonLoc.click();

    const headerLoc = this.page.locator('h2');
    await expect(headerLoc).toHaveText('Verify your account');
  };

  resendEmailVerification = async () => {
    // Click the "Resend" button to resend an account verification email
    await this.resendVerificationButtonLoc.click();

    const notifLoc = this.page.locator('.notification');
    const notifTestId = await notifLoc.getAttribute('data-test-id');
    await expect(notifTestId).toBe('success-notification');
    await expect(notifLoc).toHaveText('Verification email has been resent');
  };

  confirmUser = async (code, username) => {
    // Navigate to the link sent in the account verification email
    await this.navigate(`/login?code=${code}&username=${username}`);

    const notifLoc = this.page.locator('.notification');
    const notifTestId = await notifLoc.getAttribute('data-test-id');
    await expect(notifTestId).toBe('success-notification');
    await expect(notifLoc).toHaveText('Your registration has been confirmed');
  };

  gotoSignIn = async () => {
    // Click the "Sign in" link
    // Note: Promise.all prevents a race condition between clicking and waiting for the main frame to navigate
    await Promise.all([
      this.signInLinkLoc.click(),
      this.page.waitForNavigation()
    ]);
    await expect(this.page).toHaveURL(this.baseURL + '/login');
  };

  /* MOCK API HELPERS (INTERNAL) */
  #mockRegisterUser = async (userConfirmed = false) => {
    await this.page.route(
      getCloudfrontURLRegex('/user/register'),
      (route, request) => {
        if (request.method() === 'POST') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({ userConfirmed })
          });
        } else route.continue();
      }
    );
  };

  #mockResendEmailVerification = async () => {
    await this.page.route(COGNITO_IDP_URL_REGEX, (route, request) => {
      if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            CodeDeliveryDetails: {
              AttributeName: 'email',
              DeliveryMedium: 'EMAIL',
              Destination: 'x***@y***'
            }
          })
        });
      } else route.continue();
    });
  };

  #mockConfirmUser = async () => {
    await this.page.route(COGNITO_IDP_URL_REGEX, (route, request) => {
      if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({})
        });
      } else route.continue();
    });
  };
}

module.exports = RegisterPageModel;
