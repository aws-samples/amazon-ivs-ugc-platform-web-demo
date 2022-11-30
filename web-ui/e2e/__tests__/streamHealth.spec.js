// @ts-check
const { extendTestFixtures } = require('../utils');
const { StreamHealthPageModel } = require('../models');

const test = extendTestFixtures({
  name: 'streamHealthPage',
  PageModel: StreamHealthPageModel
});

test.describe('Stream Health Page', () => {
  test.describe('General Cases', () => {
    test('should display a dropdown when a new user clicks on the stream session navigator with the appropriate messages', async ({
      streamHealthPage: { openStreamSessionNavigatorNewUser },
      page
    }) => {
      await openStreamSessionNavigatorNewUser();
      await page.takeScreenshot(
        'no-sessions-stream-session-navigator-dropdown-open'
      );
    });

    test('should navigate to the settings page when static notification is clicked on', async ({
      streamHealthPage: { goToSettings },
      page
    }) => {
      await page.takeScreenshot('initial-page-load');
      await goToSettings('static-notification');
    });

    test('should navigate to the settings page when floating player is clicked on', async ({
      streamHealthPage: { goToSettings },
      page,
      isMobile
    }) => {
      await page.takeScreenshot('initial-page-load');
      if (!isMobile) {
        await goToSettings('floating-player');
      }
    });
  });
});
