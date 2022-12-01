// @ts-check
const { expect } = require('@playwright/test');

const { extendTestFixtures } = require('../utils');
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
      async ({ streamHealthPage: { timestampLocators }, page, isMobile }) => {
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
        const streamEventsLoc = page.getByRole('button', {
          name: /Show description for the ([a-z\s]+) stream event/
        });

        expect(await streamEventsLoc.count()).toBe(isMobile ? 2 : 4);
        await expect(streamEventsLoc.first().getByRole('heading')).toHaveText(
          'Session created'
        );
        await expect(streamEventsLoc.nth(1).getByRole('heading')).toHaveText(
          'Stream started'
        );
        if (!isMobile) {
          await expect(streamEventsLoc.nth(2).getByRole('heading')).toHaveText(
            'Session ended'
          );
          await expect(streamEventsLoc.last().getByRole('heading')).toHaveText(
            'Stream ended'
          );
        }

        // Assert that the appropriate text exists inside of the status bar component
        const statusBarComponentStatusLoc = page
          .getByRole('status')
          .getByText('Offline');
        const concurrentViewsValueLoc = page.getByRole('status').getByText('1');

        expect(statusBarComponentStatusLoc).toBeVisible();
        expect(concurrentViewsValueLoc).toBeVisible();

        // Assert that the text inside the floating player is correct
        const floatingPlayerHeaderLoc = page
          .getByTestId('floating-player')
          .getByText('Your channel is offline');

        if (!isMobile) {
          expect(floatingPlayerHeaderLoc).toBeVisible();
        }

        // Assert that the currently selected zoom window is "All" and that the appropriate indicator is selected when clicked
        const selectedZoomWindowIndicationLoc = page.getByRole('button', {
          pressed: true
        });
        const zoomWindow1hrIndicationLoc = page.getByRole('button', {
          name: 'Show the latest 1 hour of data'
        });

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
      async ({ page, baseURL }) => {
        const navArrowNextSessionLoc = page.getByRole('button', {
          name: 'Go to next session'
        });
        const navArrowPrevSessionLoc = page.getByRole('button', {
          name: 'Go to previous session'
        });
        await expect(navArrowPrevSessionLoc).toBeEnabled();
        await expect(navArrowNextSessionLoc).toBeDisabled();

        await navArrowPrevSessionLoc.click();
        await expect(navArrowPrevSessionLoc).toBeDisabled();
        await expect(navArrowNextSessionLoc).toBeEnabled();
        expect(page.url()).toBe(`${baseURL}/health/streamId-0`);
      }
    );
    testWithoutNavigation(
      'the user should be able to navigate between sessions using the session dropdown',
      async ({ streamHealthPage: { timestampLocators }, page, baseURL }) => {
        const streamSessionNavigatorButton = page.getByTestId(
          'stream-session-navigator-button'
        );
        const streamSessionDropdown = page.getByTestId(
          'stream-session-dropdown'
        );
        const streamSessionDropdownSessionsButton =
          streamSessionDropdown.getByRole('button');
        const navigateToStreamSessionBtnLoc = page.getByRole('button', {
          name: 'Navigate to stream session streamId-0'
        });

        await streamSessionNavigatorButton.click();
        await page.takeScreenshot('offline-navigator-dropdown', {
          mask: timestampLocators
        });
        expect(await streamSessionDropdownSessionsButton.count()).toBe(2);
        await navigateToStreamSessionBtnLoc.click();
        expect(page.url()).toBe(`${baseURL}/health/streamId-0`);
      }
    );
  });
});
