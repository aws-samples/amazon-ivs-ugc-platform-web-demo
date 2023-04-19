// @ts-check
const { expect } = require('@playwright/test');

const { slugify } = require('../utils');
const BasePageModel = require('./BasePageModel');
const SharedUIComponents = require('./SharedUIComponents');
const StreamSessionsComponent = require('./StreamSessionsComponent');

class StreamHealthPageModel extends BasePageModel {
  static #isInternalConstructing = false;
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    if (!StreamHealthPageModel.#isInternalConstructing) {
      throw new TypeError('StreamHealthPageModel is not constructable');
    }

    super(page, baseURL, '/health');

    /* Locators */
    this.sessionNavigatorButtonLoc = page.getByTestId(
      'stream-session-navigator-button'
    );
    this.streamSessionDropdownLoc = page.getByTestId('no-streams');
    this.staticNotificationSettingsButtonLoc = page
      .getByRole('article')
      .getByRole('link', { name: 'Settings' });

    this.getEncoderConfigItemLoc = (encoderConfigLabel) =>
      page.getByTestId(`${slugify(encoderConfigLabel)}-config-label`);
    this.getEncoderConfigItemCopyBtnLoc = (encoderConfigLabel) =>
      page.getByRole('button', {
        name: `Copy the ${encoderConfigLabel.toLowerCase()} value`
      });
    this.getZoomWindowButtonLoc = (timeDurationString) =>
      page.getByRole('button', {
        name: `Show the latest ${timeDurationString} of data`
      });

    this.floatingPlayerLoc = page.getByTestId('floating-player');
    this.floatingPlayerVideoContainerLoc = page.getByTestId(
      'floating-player-video-container'
    );
    this.floatingPlayerOfflineHeaderLoc = this.floatingPlayerLoc.getByText(
      'Your channel is offline'
    );

    this.notifLoc = this.page.getByTestId('success-notification');
    this.streamSessionDropdownLoc = page.getByTestId('stream-session-dropdown');
    this.streamEventsLoc = page.getByRole('button', {
      name: /Show description for the ([a-z\s]+) stream event/
    });

    this.streamSessionNavigatorButtonLoc = page.getByTestId(
      'stream-session-navigator-button'
    );
    this.navArrowNextSessionLoc = page.getByRole('button', {
      name: 'Go to next session'
    });
    this.navArrowPrevSessionLoc = page.getByRole('button', {
      name: 'Go to previous session'
    });

    this.selectedZoomWindowIndicationLoc = page.getByRole('button', {
      pressed: true
    });

    /**
     * Timestamp locators
     * The following locators include all the timestamps present after page load.
     */
    this.sessionNavigatorBtnDateLoc = page.getByTestId(
      'session-navigator-date'
    );
    this.sessionNavigatorBtnTimeLoc = page.getByTestId(
      'session-navigator-time'
    );
    this.chartZoomStartTimeLoc = page.getByTestId('chart-zoom-start-time');
    this.chartZoomEnTimeLoc = page.getByTestId('chart-zoom-end-time');
    this.streamEventsDateTimeLoc = page.getByTestId('stream-event-date-time');
    this.streamSessionDropdownDateTime = page.getByTestId('session-data');

    this.timestampLocators = [
      this.sessionNavigatorBtnDateLoc,
      this.sessionNavigatorBtnTimeLoc,
      this.chartZoomStartTimeLoc,
      this.chartZoomEnTimeLoc,
      this.streamEventsDateTimeLoc,
      this.streamSessionDropdownDateTime
    ];
  }

  static create = async (page, baseURL, options = {}) => {
    StreamHealthPageModel.#isInternalConstructing = true;
    const streamHealthPage = new StreamHealthPageModel(page, baseURL);
    StreamHealthPageModel.#isInternalConstructing = false;

    streamHealthPage.streamSessionsComponent =
      await StreamSessionsComponent.create(page);
    streamHealthPage.sharedUIComponents = SharedUIComponents.create(page);
    await streamHealthPage.init();

    const { shouldNavigateAfterCreate = true } = options;

    if (shouldNavigateAfterCreate) await streamHealthPage.navigate();

    return streamHealthPage;
  };

  /* USER FLOW OPERATIONS */

  openStreamSessionNavigatorNewUser = async () => {
    const streamSessionDropdownHeaderLoc =
      this.streamSessionDropdownLoc.getByText('No stream sessions');
    const streamSessionDropdownMessageLoc =
      this.streamSessionDropdownLoc.getByText(
        'Stream sessions will show up here when there is data.'
      );

    // The 'Stream Session Navigator' should be closed initially for the stream session events
    await expect(streamSessionDropdownHeaderLoc).toBeHidden();
    await expect(streamSessionDropdownMessageLoc).toBeHidden();

    // Click the 'Stream Session Navigator' which will open the stream session events for a new user
    await this.sessionNavigatorButtonLoc.click();

    // Check that a dropdown is visible on the page and the appropriate text is visible
    await expect(streamSessionDropdownHeaderLoc).toBeVisible();
    await expect(streamSessionDropdownMessageLoc).toBeVisible();
  };

  goToSettings = async (location) => {
    switch (location) {
      case 'static-notification':
        // Click on the static notification settings button to redirect to the settings page
        await this.staticNotificationSettingsButtonLoc.click();
        await expect(this.page).toHaveURL(this.baseURL + '/settings');
        break;
      default:
        return;
    }
  };

  copyEncoderConfigItem = async (encoderConfigLabel) => {
    // Click on the copy encoder config button
    const encoderConfigLabelLoc =
      this.getEncoderConfigItemCopyBtnLoc(encoderConfigLabel);
    await encoderConfigLabelLoc.click();

    await expect(this.notifLoc).toHaveText(`${encoderConfigLabel} copied`);
  };
}

module.exports = StreamHealthPageModel;
