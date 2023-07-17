// @ts-check
const { extendTestFixtures } = require('../utils');
const { SettingsPageModel } = require('../models');

const test = extendTestFixtures({
  name: 'settingsPage',
  PageModel: SettingsPageModel
});

test.describe('Settings Page', () => {
  test.describe('General Cases', () => {
    test('should reset a stream key', async ({
      settingsPage: { resetStreamKey },
      page
    }) => {
      await resetStreamKey();
      await page.takeScreenshot('reset-stream-key-success');
      await page.assertResponses([
        ['/channel/streamKey/reset', 200], // Reset stream key
        ['/channel', 200] // Get user data
      ]);
    });

    test('should copy the stream key and ingest server URL', async ({
      settingsPage: { copyStreamConfiguration },
      page
    }) => {
      await copyStreamConfiguration();
      await page.takeScreenshot('copy-stream-config-values-success');
    });

    test('should change the profile avatar', async ({
      settingsPage: { updateProfileAvatar },
      page
    }) => {
      await updateProfileAvatar();
      await page.takeScreenshot('change-profile-avatar-success');
      await page.assertResponses([
        ['/channel/preferences/update', 200], // Update avatar
        ['/channel', 200] // Get user data
      ]);
    });

    test('should change the profile color', async ({
      settingsPage: { updateProfileColor },
      page
    }) => {
      await updateProfileColor();
      await page.takeScreenshot('change-profile-color-success');
      await page.assertResponses([
        ['/channel/preferences/update', 200], // Update color
        ['/channel', 200] // Get user data
      ]);
    });

    test('should delete the users account', async ({
      settingsPage: { deleteAccount },
      page
    }) => {
      await deleteAccount();
      await page.takeScreenshot('delete-account-success');
      await page.assertResponses([
        ['/channel', 200] // Delete Account
      ]);
    });

    test.fixme(
      'should update username',
      async ({ settingsPage: { changeUsername }, page }) => {
        await changeUsername('testUser1');
        await page.takeScreenshot('update-username-success');
        await page.assertResponses([
          ['/channel/username/update', 200], // Update username
          ['/channel', 200] // Get user data
        ]);
      }
    );

    test('should update password', async ({
      settingsPage: { changePassword },
      page
    }) => {
      await changePassword('P@ssword!1', 'P@ssword!11');
      await page.takeScreenshot('update-password-success');
      await page.assertResponses([
        ['/', 200], // Cognito change password
        ['/', 200], // Cognito global signout
        ['/', 200] // Cognito authenticate user
      ]);
    });

    test('should navigate to Stream Manager page from the Go live from web button', async ({
      settingsPage: { navigateToStreamManager }
    }) => {
      await navigateToStreamManager();
    });
  });
});
