const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const { getCloudfrontURLRegex } = require('../utils');

class SettingsPageModel extends BasePageModel {
  static #isInternalConstructing = false;

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    if (!SettingsPageModel.#isInternalConstructing) {
      throw new TypeError('SettingsPageModel is not constructable');
    }

    super(page, baseURL, '/settings');

    /* Stream Settings Locators */
    this.resetStreamKeyButtonLoc = page.locator('button:has-text("Reset")');
    this.streamKeyFieldLoc = page.locator(
      'input:read-only[id="streamKeyValue"]'
    );
    this.ingestEndpointFieldLoc = page.locator(
      'input:read-only[id="ingestEndpoint"]'
    );
    this.copyStreamKeyButtonLoc = page
      .locator('data-test-id=stream-key-settings')
      .locator('button:has-text("Copy")');
    this.copyIngestEndpointButtonLoc = page
      .locator('data-test-id=ingest-endpoint-settings')
      .locator('button:has-text("Copy")');

    /* Other Locators */
    this.currentModalLoc = this.page.locator('div[data-test-id="modal"]');
    this.returnToStreamHealthButtonLoc = page.locator(
      'a[data-test-id="stream_health-button"]'
    );
    this.notifLoc = this.page.locator('.notification');
    this.hamburgerButtonLoc = page.locator(
      'button[data-test-id="floating-menu-toggle"]'
    );
  }

  static create = async (page, baseURL) => {
    SettingsPageModel.#isInternalConstructing = true;
    const settingsPage = new SettingsPageModel(page, baseURL);
    SettingsPageModel.#isInternalConstructing = false;

    await settingsPage.init();
    await settingsPage.#mockResetStreamKey();

    return settingsPage;
  };

  /* USER FLOW OPERATIONS */

  resetStreamKey = async () => {
    // Save the current value of the stream key before we reset it so that we can compare it later to the new value
    const initialStreamKeyValue = await this.streamKeyFieldLoc.getAttribute(
      'value'
    );

    // Click the 'Reset' button in the Reset Stream Key form
    await this.resetStreamKeyButtonLoc.click();
    await (
      await this.page.waitForSelector('div[data-test-id="modal"]')
    ).waitForElementState('stable');
    await this.page.takeScreenshot('reset-stream-key-confirmation');

    // Check that a modal has popped up containing the proper message
    const modalHeaderLoc = this.currentModalLoc.locator('h3');
    await expect(modalHeaderLoc).toHaveText(
      'Are you sure you would like to reset your stream key?'
    );

    // Click the "Reset stream key" button
    // Note: Promise.all prevents a race condition between clicking and waiting for the response
    const modalResetStreamKeyButtonLoc = this.currentModalLoc.locator(
      'button.destructive:has-text("Reset stream key")'
    );
    await Promise.all([
      // Waits for a response from the GET /channel/streamKey/reset endpoint
      this.page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/channel/streamKey/reset' &&
          response.status() === 200
      ),
      // Waits for a response from the GET /channel key endpoint
      this.page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/channel' &&
          response.status() === 200
      ),
      modalResetStreamKeyButtonLoc.click()
    ]);

    // Save the new stream key value and compare it against the previous stream key vlaue
    const newStreamKeyValue = await this.streamKeyFieldLoc.getAttribute(
      'value'
    );

    await expect(initialStreamKeyValue).not.toBe(newStreamKeyValue);
    await expect(newStreamKeyValue).toMatch(
      /sk_mock-region_mock-stream-key_NEW_.+/
    );
  };

  copyStreamConfiguration = async () => {
    await this.copyStreamKeyButtonLoc.click();
    const copiedStreamKeyValue = await this.page.readClipboard();
    if (copiedStreamKeyValue === null || copiedStreamKeyValue === undefined) {
      /**
       * Clipboard value could not be retrieved due to browser limitations or security reasons,
       * (i.e. Safari requires a secure context, like https, when running in CI and Firefox does
       * not provide support for reading the clipboard) so we check for a success notification
       * instead as a fallback.
       */
      await expect(this.notifLoc).toHaveText('Stream key copied');
    } else {
      const streamKeyValue = await this.streamKeyFieldLoc.getAttribute('value');
      await expect(copiedStreamKeyValue).toEqual(streamKeyValue);
    }

    await this.copyIngestEndpointButtonLoc.click();
    const copiedIngestEndpointValue = await this.page.readClipboard();
    if (
      copiedIngestEndpointValue === null ||
      copiedIngestEndpointValue === undefined
    ) {
      await expect(this.notifLoc).toHaveText('Ingest server URL copied');
    } else {
      const ingestEndpointValue =
        await this.ingestEndpointFieldLoc.getAttribute('value');
      await expect(copiedIngestEndpointValue).toEqual(ingestEndpointValue);
    }
  };

  returnToStreamHealth = async () => {
    /**
     * Click the stream health link button
     * When hamburger button is visible (Mobile), click it and wait for profile menu to click stream health button.
     */
    const hasHamburgerBtn = await this.page.$(
      'button[data-test-id="floating-menu-toggle"]'
    );
    if (!!hasHamburgerBtn) {
      await this.hamburgerButtonLoc.click();
    }
    await this.returnToStreamHealthButtonLoc.click();
    await expect(this.page).toHaveURL(new RegExp(`${this.baseURL}/health`));
  };

  /* MOCK API HELPERS (INTERNAL) */

  #mockResetStreamKey = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel/streamKey/reset'),
      (route, request) => {
        if (request.method() === 'GET') {
          const newStreamKeyValue = `sk_mock-region_mock-stream-key_NEW_${new Date().toISOString()}`;
          this.streamKeyValue = newStreamKeyValue;

          route.fulfill({
            status: 200,
            body: JSON.stringify({ streamKeyValue: newStreamKeyValue })
          });
        } else route.fallback();
      }
    );
  };
}

module.exports = SettingsPageModel;
