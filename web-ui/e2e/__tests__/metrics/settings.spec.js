// @ts-check
const { expect } = require('@playwright/test');

const { extendTestFixtures } = require('../../utils');
const { SettingsPageModel } = require('../../models');

const test = extendTestFixtures({
  settingsPage: async ({ page, baseURL }, use) => {
    const settingsPage = await SettingsPageModel.create(page, baseURL);
    await use(settingsPage);
  }
});

test.describe('Settings Page', () => {
  test.beforeEach(({ page }) => {
    page.addAPIResponseEventListener();
  });
  test.afterEach(({ page }) => {
    page.removeAPIResponseEventListener();
  });

  test('should reset a stream key', async ({
    settingsPage: { resetStreamKey },
    page
  }) => {
    await resetStreamKey();
    await (
      await page.waitForSelector('.notification')
    ).waitForElementState('stable');
    await page.takeScreenshot('reset-stream-key-success');
    await expect
      .poll(() => page.fetchResponses?.length, { timeout: 2000 })
      .toEqual(3);
  });

  test('should copy the stream key and ingest server URL', async ({
    settingsPage: { copyStreamConfiguration },
    page
  }) => {
    await copyStreamConfiguration();
    await (
      await page.waitForSelector('.notification')
    ).waitForElementState('stable');
    await page.takeScreenshot('copy-stream-config-values-success');
  });

  test('should navigate a user to the dashboard stream monitoring page', async ({
    settingsPage: { returnToSession },
    page
  }) => {
    await returnToSession();
    await page.takeScreenshot('return-to-session');
  });
});
