// @ts-check
const { extendTestFixtures } = require('../../utils');
const { SettingsPageModel } = require('../../models');

const test = extendTestFixtures([
  { name: 'settingsPage', PageModel: SettingsPageModel }
]);

test.describe('Settings Page', () => {
  test.describe('General Cases', () => {
    test('should reset a stream key', async ({
      settingsPage: { resetStreamKey },
      page
    }) => {
      await resetStreamKey();
      await (
        await page.waitForSelector('.notification')
      ).waitForElementState('stable');
      await page.takeScreenshot('reset-stream-key-success');
      await page.assertResponses([
        ['/channel', 200], // Get user data
        ['/channel/streamKey/reset', 200], // Reset stream key
        ['/channel', 200] // Get user data
      ]);
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

    test('should navigate a user to the stream health monitoring page', async ({
      settingsPage: { returnToStreamHealth },
      page
    }) => {
      await returnToStreamHealth();
      await page.takeScreenshot('return-to-session');
    });
  });
});
