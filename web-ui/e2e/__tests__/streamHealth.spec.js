// @ts-check
const { expect } = require('@playwright/test');

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

test.describe('Stream Health Page - With Navigation', () => {
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
  });
});

testWithoutNavigation.describe(
  'Stream Health Page - Without Navigation',
  () => {
    testWithoutNavigation.describe('Offline State', () => {
      testWithoutNavigation.beforeEach(
        async ({
          streamHealthPage: {
            navigate,
            streamSessionsComponent: { updateStreamSessions }
          },
          page
        }) => {
          // Populate two stream sessions before page load
          updateStreamSessions(2);

          // make sure the url is updated to the most recent stream session
          await navigate('/health', '/health/streamId-1');

          // Wait for the data to be populate on the page before running the tests
          await page.assertResponses([
            ['/metrics/mockChannelId/streamSessions/streamId-1', 200]
          ]);
        }
      );

      testWithoutNavigation(
        'should load the offline session state of the page with the correct information on the screen',
        async ({
          streamHealthPage: {
            selectedZoomWindowIndicationLoc,
            streamEventsLoc,
            timestampLocators,
            getZoomWindowButtonLoc,
            sharedUIComponents: {
              statusBarConcurrentViewsLoc,
              statusBarHealthStatusLoc,
              statusBarTimerLoc
            }
          },
          page,
          isMobile
        }) => {
          await page.takeScreenshot('offline-page-load', {
            mask: timestampLocators
          });

          // Assert charts section
          const emptyChartStateLoc = page.getByText('No data available');
          // Visx doesn't pass down the data-testid attribute
          const chartAreaClosedLoc = page.locator('.visx-area-closed');
          // Wait for charts to render
          await chartAreaClosedLoc.first().waitFor({ state: 'visible' });
          await chartAreaClosedLoc.last().waitFor({ state: 'visible' });

          await expect(emptyChartStateLoc).toBeHidden();
          expect(await chartAreaClosedLoc.count()).toBe(2);
          await expect(chartAreaClosedLoc.first()).toBeVisible();
          await expect(chartAreaClosedLoc.last()).toBeVisible();

          // Assert stream events
          expect(await streamEventsLoc.count()).toBe(isMobile ? 2 : 4);
          await expect(streamEventsLoc.first().getByRole('heading')).toHaveText(
            'Session created'
          );
          await expect(streamEventsLoc.nth(1).getByRole('heading')).toHaveText(
            'Stream started'
          );
          if (!isMobile) {
            await expect(
              streamEventsLoc.nth(2).getByRole('heading')
            ).toHaveText('Session ended');
            await expect(
              streamEventsLoc.last().getByRole('heading')
            ).toHaveText('Stream ended');
          }

          // Assert that the appropriate text exists inside of the status bar component
          await expect(statusBarTimerLoc).toHaveText('Offline');
          await expect(statusBarConcurrentViewsLoc).toHaveText('1');
          await expect(statusBarHealthStatusLoc).toBeHidden();

          // Assert that the currently selected zoom window is "All" and that the appropriate indicator is selected when clicked
          const zoomWindow1hrIndicationLoc = getZoomWindowButtonLoc('1 hour');

          await expect(selectedZoomWindowIndicationLoc).toHaveText('All');
          await zoomWindow1hrIndicationLoc.click();
          await expect(selectedZoomWindowIndicationLoc).toHaveText('1 hr');
        }
      );

      testWithoutNavigation(
        'should copy the value of the encoder configuration item when an existing user clicks on the copy icon',
        async ({ streamHealthPage: { copyEncoderConfigItem } }) => {
          await copyEncoderConfigItem('Video encoder');
          await copyEncoderConfigItem('Audio codec');
          await copyEncoderConfigItem('Video codec');
        }
      );

      testWithoutNavigation(
        'the user should be able to navigate between sessions using the left and right arrow buttons',
        async ({
          streamHealthPage: { navArrowNextSessionLoc, navArrowPrevSessionLoc },
          page,
          baseURL
        }) => {
          await expect(navArrowNextSessionLoc).toBeDisabled();
          await expect(navArrowPrevSessionLoc).toBeEnabled();

          await navArrowPrevSessionLoc.click();
          await expect(navArrowNextSessionLoc).toBeEnabled();
          await expect(navArrowPrevSessionLoc).toBeDisabled();
          expect(page.url()).toBe(`${baseURL}/health/streamId-0`);
        }
      );

      testWithoutNavigation(
        'the user should be able to navigate between sessions using the session dropdown',
        async ({
          streamHealthPage: {
            streamSessionDropdownLoc,
            streamSessionNavigatorButtonLoc,
            timestampLocators
          },
          page,
          baseURL
        }) => {
          const streamSessionDropdownSessionsButton =
            streamSessionDropdownLoc.getByRole('button');
          const navigateToStreamSessionBtnLoc = page.getByRole('button', {
            name: 'Navigate to stream session streamId-0'
          });

          await streamSessionNavigatorButtonLoc.click();
          await page.takeScreenshot('offline-navigator-dropdown', {
            mask: timestampLocators
          });
          expect(await streamSessionDropdownSessionsButton.count()).toBe(2);
          await navigateToStreamSessionBtnLoc.click();
          expect(page.url()).toBe(`${baseURL}/health/streamId-0`);
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

          // Make sure the url is updated to the most recent stream session
          await navigate('/health', '/health/streamId-2');
        }
      );

      testWithoutNavigation(
        'should load the currently live session',
        async ({
          page,
          streamHealthPage: {
            floatingPlayerVideoContainerLoc,
            sharedUIComponents: { statusBarTimerLoc }
          }
        }) => {
          await page.waitForResponse(
            getCloudfrontURLRegex('/metrics/mockChannelId/streamSessions/(.+)')
          );
          await page.takeScreenshot('initial-page-load-live', {
            mask: [floatingPlayerVideoContainerLoc, statusBarTimerLoc]
          });
        }
      );

      testWithoutNavigation(
        'should show the appropriate values in the status bar component',
        async ({
          streamHealthPage: {
            sharedUIComponents: {
              statusBarTimerLoc,
              statusBarConcurrentViewsLoc,
              statusBarHealthStatusLoc
            }
          }
        }) => {
          // Assert the status bar content
          await expect(statusBarTimerLoc).toHaveText(/00:\d{2}:\d{2}/);
          await expect(statusBarConcurrentViewsLoc).toHaveText('1');
          await expect(statusBarHealthStatusLoc).toBeHidden();
        }
      );

      testWithoutNavigation(
        'should have LIVE notification in stream session dropdown',
        async ({
          streamHealthPage: {
            streamSessionNavigatorButtonLoc,
            streamSessionDropdownLoc,
            floatingPlayerVideoContainerLoc,
            sharedUIComponents: { statusBarTimerLoc }
          },
          page
        }) => {
          await streamSessionNavigatorButtonLoc.click();
          await page.mouse.down();
          await page.takeScreenshot('stream-sessions-live-dropdown-open', {
            mask: [floatingPlayerVideoContainerLoc, statusBarTimerLoc]
          });
          const liveSessionButtonLoc = streamSessionDropdownLoc
            .getByRole('button')
            .getByText('LIVE');
          expect(liveSessionButtonLoc).toBeVisible();
        }
      );

      testWithoutNavigation(
        'should show the appropriate amount of stream session events',
        async ({ streamHealthPage: { streamEventsLoc }, page }) => {
          await page.waitForResponse(
            getCloudfrontURLRegex('/metrics/mockChannelId/streamSessions/(.+)')
          );
          // Assert live stream events
          expect(await streamEventsLoc.count()).toBe(2);
          await expect(streamEventsLoc.nth(1).getByRole('heading')).toHaveText(
            'Session created'
          );
          await expect(streamEventsLoc.first().getByRole('heading')).toHaveText(
            'Stream started'
          );
        }
      );

      testWithoutNavigation(
        'should be able to navigate between sessions using the left and right arrow buttons',
        async ({
          streamHealthPage: { navArrowNextSessionLoc, navArrowPrevSessionLoc },
          page,
          baseURL
        }) => {
          await expect(navArrowPrevSessionLoc).toBeEnabled();
          await expect(navArrowNextSessionLoc).toBeDisabled();

          await navArrowPrevSessionLoc.click();
          await expect(navArrowPrevSessionLoc).toBeEnabled();
          await expect(navArrowNextSessionLoc).toBeEnabled();

          expect(page.url()).toBe(`${baseURL}/health/streamId-1`);

          await navArrowPrevSessionLoc.click();
          await expect(navArrowPrevSessionLoc).toBeDisabled();
          await expect(navArrowNextSessionLoc).toBeEnabled();

          expect(page.url()).toBe(`${baseURL}/health/streamId-0`);
        }
      );

      testWithoutNavigation(
        'should default zoom charts in to 5 min',
        async ({
          streamHealthPage: {
            selectedZoomWindowIndicationLoc,
            getZoomWindowButtonLoc
          }
        }) => {
          const zoomWindow1hrIndicationLoc = getZoomWindowButtonLoc('1 hour');

          await expect(selectedZoomWindowIndicationLoc).toHaveText('5 min');
          await zoomWindow1hrIndicationLoc.click();
          await expect(selectedZoomWindowIndicationLoc).toHaveText('1 hr');
        }
      );

      testWithoutNavigation(
        'should show tooltip for live session in session status bar',
        async ({
          streamHealthPage: {
            sharedUIComponents: {
              statusBarConcurrentViewsLoc,
              statusBarTooltipLoc
            }
          },
          isMobile,
          page
        }) => {
          isMobile
            ? await statusBarConcurrentViewsLoc.click()
            : await statusBarConcurrentViewsLoc.hover();
          await page.mouse.down();
          await expect(statusBarTooltipLoc).toBeVisible();
        }
      );
    });
  }
);
