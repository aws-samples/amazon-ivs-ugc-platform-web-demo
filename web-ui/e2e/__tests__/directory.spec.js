// @ts-check

const { extendTestFixtures } = require('../utils');
const { DirectoryPageModel } = require('../models');

const loggedOutTest = extendTestFixtures(
  { name: 'directoryPage', PageModel: DirectoryPageModel },
  { isAuthenticated: false }
);

const test = extendTestFixtures(
  { name: 'directoryPage', PageModel: DirectoryPageModel },
  { isAuthenticated: true }
);

test.describe('Directory Page', () => {
  test.describe('General Cases', () => {
    loggedOutTest(
      'should show empty state text for live stream and try again button',
      async ({ directoryPage: { loggedOutEmptyState } }) => {
        await loggedOutEmptyState();
      }
    );

    // Following Carousel

    test.describe('Followers State', () => {
      test.beforeEach(
        async ({ directoryPage: { followedStreamersComponent }, page }) => {
          // Populate followers before page load
          await page.assertResponses([
            ['/channels', 200],
            ['/channel', 200],
            ['/channels/testUser', 200],
            ['/channel/followingList', 200]
          ]);
        }
      );

      test('should show followed channels in carousel and should navigate to channel when user avatar is clicked', async ({
        directoryPage: {
          loggedInWithFollowersState,
          navigateToFollowedUserChannel
        }
      }) => {
        await loggedInWithFollowersState();
        await navigateToFollowedUserChannel();
      });

      test('should navigate to channel after enter key is pressed', async ({
        directoryPage: { navigateToFollowedUserChannelKeyboard }
      }) => {
        await navigateToFollowedUserChannelKeyboard();
      });

      test('should rotate when navigate button is clicked', async ({
        directoryPage: { carouselButtonClickedStates }
      }) => {
        await carouselButtonClickedStates();
      });

      test('should rotate carousel when navigator button is pressed with keyboard', async ({
        directoryPage: { carouselButtonKeyboardStates }
      }) => {
        await carouselButtonKeyboardStates();
      });

      test('should tab through carousel', async ({
        directoryPage: { carouselTabStates },
        isMobile
      }) => {
        await carouselTabStates(isMobile);
      });
    });
  });
});
