const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const {
  COGNITO_IDP_URL_REGEX,
  getMockCognitoSessionTokens
} = require('../utils');

class LoginPageModel extends BasePageModel {
  static #isInternalConstructing = false;

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    if (!LoginPageModel.#isInternalConstructing) {
      throw new TypeError('LoginPageModel is not constructable');
    }

    super(page, baseURL, '/login');

    // Locators
    this.usernameInputLoc = page.locator('input[id="username"]');
    this.passwordInputLoc = page.locator('input[id="password"]');
    this.signInButtonLoc = page.locator('button:has-text("Sign in")');
    this.forgotPasswordLinkLoc = page.locator('a:has-text("Forgot password?")');
    this.createAnAccountLinkLoc = page.locator(
      'a:has-text("Create an account")'
    );

    this.sidebarAvatarButtonLoc = page.getByTestId('sidebar-avatar');
    this.logoutButtonLoc = page.getByText('Log out');
    this.floatingMenuToggleLoc = page.getByTestId('floating-menu-toggle');
    this.logoutFloatingMenuButtonLoc = page.getByTestId('logout-action');
  }

  static create = async (page, baseURL) => {
    LoginPageModel.#isInternalConstructing = true;
    const loginPage = new LoginPageModel(page, baseURL);
    LoginPageModel.#isInternalConstructing = false;

    await loginPage.init();
    await loginPage.#mockSignIn();

    return loginPage;
  };

  /* USER FLOW OPERATIONS */

  login = async (username, password) => {
    // Click and fill username input field
    await this.usernameInputLoc.click();
    await this.usernameInputLoc.fill(username);
    await expect(this.usernameInputLoc).toHaveValue(username);

    // Click and fill password input field
    await this.passwordInputLoc.click();
    await this.passwordInputLoc.fill(password);
    await expect(this.passwordInputLoc).toHaveValue(password);

    await this.page.takeScreenshot('login-filled-form');

    // Click the "Sign in" button and check that we have been redirected to the dashboard page
    // Note: Promise.all prevents a race condition between clicking and waiting for the main frame to navigate
    await Promise.all([
      this.page.waitForNavigation(),
      this.signInButtonLoc.click(),
      this.page.resetCursorPosition()
    ]);
    await expect(this.page).toHaveURL(new RegExp(`${this.baseURL}/`));
  };

  logout = async (hasHamburgerBtn) => {
    // Login a new test user
    await this.login(this.username, 'Passw0rd!');
    let profileMenuBtn;
    if (hasHamburgerBtn) {
      profileMenuBtn = this.floatingMenuToggleLoc;
    } else {
      profileMenuBtn = this.sidebarAvatarButtonLoc;
    }
    // Click the "Log out" button and check that we have been logged out and redirected to the login page
    // Note: Promise.all prevents a race condition between clicking and waiting for the main frame to navigate
    await Promise.all([profileMenuBtn.click(), this.logoutButtonLoc.click()]);

    await expect(this.page).toHaveURL(new RegExp(`${this.baseURL}/`));

    const localStorage = await this.page.getLocalStorage();
    await expect(localStorage).toBeUndefined();
  };

  gotoForgotPassword = async () => {
    // Click the "Forgot password?" link
    await this.forgotPasswordLinkLoc.click();
    await expect(this.page).toHaveURL(this.baseURL + '/reset');
  };

  gotoCreateAnAccount = async () => {
    // Click the "Create an account" link
    await this.createAnAccountLinkLoc.click();
    await expect(this.page).toHaveURL(this.baseURL + '/register');
  };

  /* MOCK API HELPERS (INTERNAL) */

  #mockSignIn = async () => {
    await this.page.route(COGNITO_IDP_URL_REGEX, (route, request) => {
      if (
        request.headers()['x-amz-target'] ===
        'AWSCognitoIdentityProviderService.InitiateAuth'
      ) {
        const { accessToken, idToken, refreshToken } =
          getMockCognitoSessionTokens();

        route.fulfill({
          status: 200,
          body: JSON.stringify({
            AuthenticationResult: {
              AccessToken: accessToken,
              IdToken: idToken,
              RefreshToken: refreshToken,
              ExpiresIn: 3600,
              TokenType: 'Bearer'
            },
            ChallengeParameters: {}
          })
        });
      } else route.fallback();
    });
  };
}

module.exports = LoginPageModel;
