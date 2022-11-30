// @ts-check
const { extendTestFixtures, getCloudfrontURLRegex } = require('../utils');
const { StreamHealthPageModel } = require('../models');

const test = extendTestFixtures({
  name: 'streamHealthPage',
  PageModel: StreamHealthPageModel
});

const testWithoutNavigation = extendTestFixtures(
  { name: 'streamHealthPage', PageModel: StreamHealthPageModel },
  { shouldNavigateAfterCreate: false }
);

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

  testWithoutNavigation.describe('Offline State', () => {
    testWithoutNavigation.beforeEach(
      async ({
        streamHealthPage: {
          navigate,
          streamSessionsComponent: { updateStreamSessions }
        }
      }) => {
        // Populate the stream sessions before page load
        updateStreamSessions(1);

        await navigate();
      }
    );

    testWithoutNavigation(
      'should load the first offline session',
      async ({ page }) => {
        await page.waitForResponse(
          getCloudfrontURLRegex('/metrics/mockChannelId/streamSessions', {
            nextToken: ''
          })
        );
      }
    );
  });

  testWithoutNavigation.describe('Live State', () => {
    testWithoutNavigation.beforeEach(
      async ({
        streamHealthPage: {
          navigate,
          streamSessionsComponent: { updateStreamSessions }
        }
      }) => {
        // Populate the stream sessions before page load
        updateStreamSessions(3, true);

        await navigate();
      }
    );

    testWithoutNavigation(
      'should load the currently live session',
      async ({ page }) => {
        await page.waitForResponse(
          getCloudfrontURLRegex('/metrics/mockChannelId/streamSessions/(.+)')
        );
      }
    );
  });
});
