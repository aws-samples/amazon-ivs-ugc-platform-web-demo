// @ts-check
const { chromium } = require('@playwright/test');

const { LoginPageModel } = require('./models');

const noop = () => {};
const overridePageFixture = (page) => {
  page.getLocalStorage = noop;
  page.takeScreenshot = noop;
  page.readClipboard = noop;
  page.fetchResponses = [];

  return page;
};

/**
 * Save the authenticated state in global storage so that all tests
 * can use the same access and refresh tokens for authentication
 */
const globalSetup = async (config) => {
  const { baseURL, storageState, headless } = config.projects[0].use;
  const browser = await chromium.launch({ headless });
  const basePage = await browser.newPage();
  const page = overridePageFixture(basePage);
  const loginPage = await LoginPageModel.create(page, baseURL);

  await loginPage.login('testUser', 'Passw0rd!');

  await page.evaluate((userResourcesCreated) => {
    window.localStorage.setItem('resourcesCreated', userResourcesCreated);
  }, loginPage.userResourcesCreated);

  // Save signed-in state to './e2e/storageState.json'.
  await page.context().storageState({ path: storageState });
  await browser.close();
};

module.exports = globalSetup;
