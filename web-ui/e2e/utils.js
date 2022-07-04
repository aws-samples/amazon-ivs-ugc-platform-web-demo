// @ts-check
const { expect, test: baseTest } = require('@playwright/test');

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
      const onResponse = (response) => {
        const resourceType = response.request().resourceType();
        if (resourceType === 'fetch') {
          page.fetchResponses.push(response);
          expect(response.ok()).toBeTruthy();
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

const getCloudfrontURLRegex = (endpoint) =>
  new RegExp(`https://([A-Za-z0-9-]+).cloudfront.net${endpoint}`);

const COGNITO_IDP_URL_REGEX = new RegExp(
  'https://cognito-idp.([A-Za-z0-9-]+).amazonaws.com/'
);

module.exports = {
  getCloudfrontURLRegex,
  extendTestFixtures,
  COGNITO_IDP_URL_REGEX
};
