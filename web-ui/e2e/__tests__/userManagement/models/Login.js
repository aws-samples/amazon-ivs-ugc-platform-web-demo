const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const {
  COGNITO_IDP_URL_REGEX,
  getCloudfrontURLRegex,
  getMockCognitoSessionTokens
} = require('../../../utils');

class LoginPageModel extends BasePageModel {
  resourcesCreated = false;

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    super(page, baseURL, '/login');

    // Locators
    this.usernameInputLoc = page.locator('input[id="username"]');
    this.passwordInputLoc = page.locator('input[id="password"]');
    this.signInButtonLoc = page.locator('button:has-text("Sign in")');
    this.forgotPasswordLinkLoc = page.locator('a:has-text("Forgot password?")');
    this.createAnAccountLinkLoc = page.locator(
      'a:has-text("Create an account")'
    );
  }

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
      this.signInButtonLoc.click()
    ]);
    await expect(this.page).toHaveURL(
      new RegExp(`${this.baseURL}/dashboard/stream.*`)
    );
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

  /* MOCK API HELPERS */

  mockSignIn = async () => {
    await this.page.route(COGNITO_IDP_URL_REGEX, (route, request) => {
      if (request.method() === 'POST') {
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
      }
    });
  };

  mockGetUser = async () => {
    await this.page.route(getCloudfrontURLRegex('/user'), (route, request) => {
      if (request.method() === 'GET') {
        if (this.resourcesCreated) {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              channelResourceId: 'mock-channel-id',
              ingestEndpoint:
                'rtmps://mock-channel-id.global-contribute.live-video.net:443/app/',
              playbackUrl:
                'https://mock-channel-id.mock-region.playback.live-video.net/api/video/v1/mock-region.mock-account-id.channel.mock-channel-id.m3u8',
              streamKeyValue: 'sk_mock-region_mock-stream-key',
              username: 'testUser'
            })
          });
        } else {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ __type: 'UnexpectedException' })
          });
        }
      } else route.continue();
    });
  };

  mockCreateResources = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/user/resources/create'),
      (route, request) => {
        if (request.method() === 'POST') {
          this.resourcesCreated = true;
          route.fulfill({
            status: 200,
            body: JSON.stringify({})
          });
        } else route.continue();
      }
    );
  };
}

module.exports = LoginPageModel;
