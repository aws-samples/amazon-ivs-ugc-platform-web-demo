// @ts-check
const { test: baseTest } = require('@playwright/test');
const {
  CognitoAccessToken,
  CognitoIdToken,
  CognitoRefreshToken
} = require('amazon-cognito-identity-js');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const extendTestFixtures = (fixtures = {}) =>
  baseTest.extend({
    /**
     * Page fixture override
     */
    page: async ({ page, screenshot }, use, testInfo) => {
      // "takeScreenshot" will save screenshots to the ./e2e/screenshots directory
      page.takeScreenshot = async (name) => {
        const filename = `${testInfo.titlePath[1].replace(/\s/g, '')}-${name}`;
        const path = `./e2e/screenshots/${filename}.png`;
        await page.screenshot({ path });
      };

      /**
       * "fetchResponses" is a list that contains all the API fetch responses received in that test,
       * updated throughout the test's execution. An assertion should use asynchornous polling to
       * ensure that the expected response was recevied at the time of assertion:
       *
       * @example
       * await expect
       *  .poll(() => page.fetchResponses?.length, { timeout: 2000 })
       *  .toEqual(1);
       */
      page.fetchResponses = [];
      const onResponse = async (response) => {
        const resourceType = response.request().resourceType();
        if (resourceType === 'fetch') {
          await response.finished();
          page.fetchResponses.push(response);
        }
      };
      page.addAPIResponseEventListener = () => {
        page.on('response', onResponse);
      };
      page.removeAPIResponseEventListener = () => {
        page.off('response', onResponse);
        page.fetchResponses = [];
      };

      await use(page);
    },
    ...fixtures
  });

const getMockCognitoSessionTokens = (
  username = 'testUser',
  email = 'testuser@streamhealth.com'
) => {
  const accessToken = new CognitoAccessToken({
    AccessToken: jwt.sign(
      {
        sub: uuidv4(),
        iss: `https://cognito-idp.us-west-2.amazonaws.com/${process.env.REACT_APP_COGNITO_USER_POOL_ID}`,
        client_id: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
        origin_jti: uuidv4(),
        event_id: uuidv4(),
        token_use: 'access',
        scope: 'aws.cognito.signin.user.admin',
        auth_time: 1656962384,
        exp: 7640000000000,
        iat: 1656962384,
        jti: uuidv4(),
        username
      },
      'mock-access-token-secret'
    )
  }).getJwtToken();

  const idToken = new CognitoIdToken({
    IdToken: jwt.sign(
      {
        sub: uuidv4(),
        email_verified: true,
        iss: `https://cognito-idp.us-west-2.amazonaws.com/${process.env.REACT_APP_COGNITO_USER_POOL_ID}`,
        'cognito:username': username,
        origin_jti: uuidv4(),
        aud: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID,
        event_id: uuidv4(),
        token_use: 'id',
        auth_time: 1656962384,
        exp: 7640000000000,
        iat: 1656962384,
        jti: uuidv4(),
        email
      },
      'mock-id-token-secret'
    )
  }).getJwtToken();

  const refreshToken = new CognitoRefreshToken({
    IdToken: jwt.sign(
      {
        token_use: 'refresh',
        exp: 8640000000000,
        iat: 1656962384
      },
      'mock-refresh-token-secret'
    )
  }).getToken();

  return { accessToken, idToken, refreshToken };
};

const getCloudfrontURLRegex = (endpoint) =>
  new RegExp(`https://([A-Za-z0-9-]+).cloudfront.net${endpoint}`, 'g');

const COGNITO_IDP_URL_REGEX = new RegExp(
  'https://cognito-idp.([A-Za-z0-9-]+).amazonaws.com/',
  'g'
);

module.exports = {
  getCloudfrontURLRegex,
  extendTestFixtures,
  COGNITO_IDP_URL_REGEX,
  getMockCognitoSessionTokens
};
