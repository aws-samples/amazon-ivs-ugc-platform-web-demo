const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const { getCloudfrontURLRegex } = require('../utils');

class StreamHealthPageModel extends BasePageModel {
  static #isInternalConstructing = false;
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    super(page, baseURL, '/health');
    if (!StreamHealthPageModel.#isInternalConstructing) {
      throw new TypeError('StreamHealthPageModel is not constructable');
    }

    /* Locators */
    this.sessionNavigatorButtonLoc = page.getByTestId(
      'stream-session-navigator-button'
    );
    this.streamSessionDropdownLoc = page.getByTestId('no-streams');
    this.floatingPlayerFrameLoc = page.getByTestId('floating-player');
    this.staticNotificationSettingsButton = page
      .getByRole('article')
      .getByRole('link', { name: 'Settings' });
  }

  static create = async (page, baseURL) => {
    StreamHealthPageModel.#isInternalConstructing = true;
    const streamHealthPage = new StreamHealthPageModel(page, baseURL);
    StreamHealthPageModel.#isInternalConstructing = false;

    await streamHealthPage.#mockGetStreamSessions();
    await streamHealthPage.init();

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
      case 'floating-player':
        const floatingPlayerHeaderLoc = this.floatingPlayerFrameLoc.getByText(
          'Your channel is offline'
        );
        const floatingPlayerMessageLoc = this.floatingPlayerFrameLoc.getByText(
          'To start streaming, find your ingest server url and stream key in settings.'
        );
        const floatingPlayerGotoSettingsButtonLoc =
          this.floatingPlayerFrameLoc.getByRole('link', { name: 'Settings' });

        // Confirming the appropriate text in the floating player is visible
        await expect(floatingPlayerHeaderLoc).toBeVisible();
        await expect(floatingPlayerMessageLoc).toBeVisible();

        // Click on the floating player settings button to redirect to the settings page
        await floatingPlayerGotoSettingsButtonLoc.click();
        await expect(this.page).toHaveURL(this.baseURL + '/settings');
        break;
      case 'static-notification':
        // Click on the static notification settings button to redirect to the settings page
        await this.staticNotificationSettingsButton.click();
        await expect(this.page).toHaveURL(this.baseURL + '/settings');
        break;
      default:
        return;
    }
  };

  /* MOCK API HELPERS (INTERNAL) */

  #mockGetStreamSessions = async () => {
    await this.page.route(
      getCloudfrontURLRegex(`/metrics/mockChannelId/streamSessions`, {
        nextToken: ''
      }),
      (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              maxResults: 50,
              streamSessions: []
            })
          });
        } else route.fallback();
      }
    );
  };
}

module.exports = StreamHealthPageModel;
