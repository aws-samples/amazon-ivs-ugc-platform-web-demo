const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const { getCloudfrontURLRegex, COGNITO_IDP_URL_REGEX } = require('../utils');

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
      .getByTestId('stream-key-settings')
      .locator('button:has-text("Copy")');
    this.copyIngestEndpointButtonLoc = page
      .getByTestId('ingest-endpoint-settings')
      .locator('button:has-text("Copy")');

    /* Account Settings Locators */
    this.deleteAccountButtonLoc = page.getByText('Delete my account');
    this.usernameInputLoc = page.locator('input[id="username"]');
    this.changeUsernameButtonLoc = page.getByTestId(
      'change-username-form-submit-button'
    );
    this.currentPasswordInputLoc = page.locator('input[id="currentPassword"]');
    this.newPasswordInputLoc = page.locator('input[id="newPassword"]');
    this.confirmNewPasswordInputLoc = page.locator(
      'input[id="confirmNewPassword"]'
    );
    this.changePasswordButtonLoc = page.getByTestId(
      'change-password-form-submit-button'
    );
    /* Other Locators */
    this.currentModalLoc = this.page.locator('div[data-testid="modal"]');
    this.returnToStreamHealthButtonLoc = page.locator(
      'a[data-testid="stream_health-button"]'
    );
    this.notifLoc = this.page.locator('.notification');
    this.hamburgerButtonLoc = page.locator(
      'button[data-testid="floating-menu-toggle"]'
    );
    this.unselectedProfileAvatarLoc = page
      .getByTestId('image-unselected-icon')
      .first();
    this.selectedProfileAvatarLoc = page.getByTestId('image-selected-icon');
    this.unselectedProfileColorLoc = page
      .getByTestId('color-unselected-icon')
      .first();
    this.selectedProfileColorLoc = page.getByTestId('color-selected-icon');

    /* Other Locators */
    this.currentModalLoc = this.page.getByTestId('modal');
    this.notifLoc = this.page.locator('.notification');
    this.hamburgerButtonLoc = page.getByTestId('floating-menu-toggle');
  }

  static create = async (page, baseURL) => {
    SettingsPageModel.#isInternalConstructing = true;
    const settingsPage = new SettingsPageModel(page, baseURL);
    SettingsPageModel.#isInternalConstructing = false;

    await settingsPage.#mockResetStreamKey();
    await settingsPage.#mockChangePreferences();
    await settingsPage.#mockChangeUsername();
    await settingsPage.#mockChangePassword();
    await settingsPage.#mockDeleteUser();

    await settingsPage.init();

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

    expect(initialStreamKeyValue).not.toBe(newStreamKeyValue);
    expect(newStreamKeyValue).toMatch(/sk_mock-region_mock-stream-key_NEW_.+/);
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
      expect(copiedStreamKeyValue).toEqual(streamKeyValue);
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
      expect(copiedIngestEndpointValue).toEqual(ingestEndpointValue);
    }
  };

  updateProfileAvatar = async () => {
    // Save the current value of the avatar before we change it so that we can compare it
    const initialAvatarValue = this.selectedProfileAvatarLoc;
    const initialAvatarName = await this.selectedProfileAvatarLoc.getAttribute(
      'name'
    );
    // Get the currently unselected profile avatar so we can test the switch from one avatar to another
    const unSelectedAvatarValue = this.unselectedProfileAvatarLoc;
    const unSelectedAvatarName =
      await this.unselectedProfileAvatarLoc.getAttribute('name');

    // Confirm that the avatars are not the same as the original avatar
    expect(initialAvatarValue).not.toBe(unSelectedAvatarValue);

    // Click on the button to switch the avatar to the unselected one
    await this.unselectedProfileAvatarLoc.click();

    // Notification comes down with successful message
    await expect(this.notifLoc).toHaveText('Avatar saved');

    // Save the new avatar and compare it against the previous avatar name
    const newSelectedAvatarName =
      await this.selectedProfileAvatarLoc.getAttribute('name');

    // Confirm that the avatar intial avatar is not the same as the new avatar and is the same as the new avatar
    expect(initialAvatarName).not.toBe(newSelectedAvatarName);
    expect(unSelectedAvatarName).toBe(newSelectedAvatarName);
  };

  updateProfileColor = async () => {
    // Save the current value of the color before we change it so that we can compare it
    const initialColorValue = this.selectedProfileColorLoc;
    const initialColorName = await this.selectedProfileColorLoc.getAttribute(
      'name'
    );
    // Get a current version of the profile color that isn't selected so we can test the switch from one color icon to another
    const unSelectedColorValue = this.unselectedProfileColorLoc;
    const unSelectedColorName =
      await this.unselectedProfileColorLoc.getAttribute('name');

    // Confirm that the colors are not the same as the original color
    expect(initialColorValue).not.toBe(unSelectedColorValue);

    // Click on the button to switch the color to the unselected one
    await this.unselectedProfileColorLoc.click();

    // Notification comes down with successful message
    await expect(this.notifLoc).toHaveText('Color saved');

    // Save the new color and compare it against the previous color name
    const newSelectedColorName =
      await this.selectedProfileColorLoc.getAttribute('name');

    // Confirm that the color intial color is not the same as the new color and is the same as the new avatar
    expect(initialColorName).not.toBe(newSelectedColorName);
    expect(unSelectedColorName).toBe(newSelectedColorName);
  };

  deleteAccount = async () => {
    // Click on the button to prompt a confirm delete account modal
    await this.deleteAccountButtonLoc.click();
    await this.page.takeScreenshot('delete-account-confirmation');

    // Check that a modal has popped up containing the proper message
    const modalHeaderLoc = this.currentModalLoc.locator('h3');
    await expect(modalHeaderLoc).toHaveText(
      'Are you sure you would like to delete your account?'
    );

    // Note: Promise.all prevents a race condition between clicking and waiting for the response
    const modalDeleteAccountButtonLoc = this.currentModalLoc.locator(
      'button.destructive:has-text("Delete account")'
    );

    await Promise.all([
      // Waits for a response from the DELETE /user endpoint
      this.page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === '/channel' &&
          response.status() === 200
      ),
      modalDeleteAccountButtonLoc.click()
    ]);
    await expect(this.page).toHaveURL(new RegExp(`${this.baseURL}/`));
  };

  changeUsername = async (username) => {
    // Save the current value of the username before we change it so that we can compare it later to the new value
    const initialUsernameValue = await this.usernameInputLoc.getAttribute(
      'value'
    );
    // Click and fill username input field
    await this.usernameInputLoc.click();
    await this.usernameInputLoc.fill(username);
    await expect(this.usernameInputLoc).toHaveValue(username);
    // Click on the button to save username
    await this.changeUsernameButtonLoc.click();

    // Successfully changed username notification message
    await expect(this.notifLoc).toHaveText('Username saved');

    await this.page.takeScreenshot('username-update-confirmation');

    // New username after successful change
    const newUsernameValue = await this.usernameInputLoc.getAttribute('value');

    // Check to see if the usernames are now changed
    expect(initialUsernameValue).not.toBe(newUsernameValue);
    expect(newUsernameValue).toBe(username);
  };

  changePassword = async (currentPassword, newPassword) => {
    // Click and fill current password input field
    await this.currentPasswordInputLoc.click();
    await this.currentPasswordInputLoc.fill(currentPassword);
    await expect(this.currentPasswordInputLoc).toHaveValue(currentPassword);

    // Click and fill new password input field
    await this.newPasswordInputLoc.click();
    await this.newPasswordInputLoc.fill(newPassword);
    await expect(this.newPasswordInputLoc).toHaveValue(newPassword);

    // Click and fill confirm new password input field
    await this.confirmNewPasswordInputLoc.click();
    await this.confirmNewPasswordInputLoc.fill(newPassword);
    await expect(this.confirmNewPasswordInputLoc).toHaveValue(newPassword);

    await this.page.takeScreenshot('updated-password-fill');

    // Click on the button to save new password
    await this.changePasswordButtonLoc.click();

    // Successfully changed password notification message
    await expect(this.notifLoc).toHaveText('Password saved');

    // Check that a modal has popped up containing the proper message
    const modalHeaderLoc = this.currentModalLoc.locator('h3');
    await expect(modalHeaderLoc).toHaveText('Password updated');

    const modalMessageLoc = this.currentModalLoc.locator('p');
    await expect(modalMessageLoc).toHaveText(
      'Your password has been updated. This change will log out your sessions on all other devices.'
    );

    await this.page.takeScreenshot('updated-password-notification');

    // Click the "Okay" button
    const modalCloseButtonLoc = this.currentModalLoc.locator(
      'button:has-text("Okay")'
    );

    // Click on the button to close the modal
    await modalCloseButtonLoc.click();
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

  #mockChangePreferences = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel/preferences/update'),
      (route, request) => {
        if (request.method() === 'PUT') {
          const { avatar, color } = request.postDataJSON();
          avatar ? (this.avatar = avatar) : (this.color = color);
          route.fulfill({
            status: 200,
            body: JSON.stringify(request.postDataJSON())
          });
        } else route.fallback();
      }
    );
  };

  #mockChangeUsername = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel/username/update'),
      (route, request) => {
        if (request.method() === 'PUT') {
          const { newUsername } = request.postDataJSON();
          this.username = newUsername;
          route.fulfill({
            status: 200,
            body: JSON.stringify({ username: newUsername })
          });
        } else route.fallback();
      }
    );
  };

  #mockChangePassword = async () => {
    await this.page.route(COGNITO_IDP_URL_REGEX, (route, request) => {
      if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          body: JSON.stringify({})
        });
      } else route.fallback();
    });
  };

  #mockDeleteUser = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel'),
      (route, request) => {
        if (request.method() === 'DELETE') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({})
          });
        } else route.fallback();
      }
    );
  };
}

module.exports = SettingsPageModel;
