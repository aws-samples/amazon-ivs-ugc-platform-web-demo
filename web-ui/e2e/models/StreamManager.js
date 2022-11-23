// @ts-check
const { expect } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');

const { getCloudfrontURLRegex, connectToWss } = require('../utils');
const BasePageModel = require('./BasePageModel');

const getStreamActionFormLocatorsVisibilityStatuses = (page) =>
  Promise.all([
    page.getByTestId('modal').isVisible(),
    page.getByTestId('mobile-panel-stream-action-panel').isVisible()
  ]);

class StreamManagerPageModel extends BasePageModel {
  static #isInternalConstructing = false;

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    if (!StreamManagerPageModel.#isInternalConstructing) {
      throw new TypeError('StreamManagerPageModel is not constructable');
    }

    super(page, baseURL, '/manager');

    /* Stream Actions Locators */
    this.getActionButtonLocator = (actionName) =>
      page.getByTestId(`stream-manager-${actionName}-action-button`);
    this.closeStreamActionModalBtnLoc = page.getByTestId(
      'stream-action-modal-close-button'
    );
    this.saveFormDataBtnLoc = page.getByText('Save');
    this.moderatingPillLoc = page.getByText('Moderating');
    this.chatPopupContainerLoc = page.getByTestId('chat-popup-container');
    this.successNotifLoc = page.getByTestId('success-notification');
  }

  static create = async (page, baseURL) => {
    StreamManagerPageModel.#isInternalConstructing = true;
    const streamManagerPage = new StreamManagerPageModel(page, baseURL);
    StreamManagerPageModel.#isInternalConstructing = false;

    await streamManagerPage.#mockBanUser();

    await streamManagerPage.init();

    return streamManagerPage;
  };

  /* Stream Actions Interactions - START */
  openStreamActionModal = async (actionName) => {
    // Click the action button
    await this.getActionButtonLocator(actionName).click();
    await this.page
      .getByTestId(`${actionName}-stream-action-form`)
      .waitFor({ state: 'visible' });

    // The content will be rendered in a modal or in a mobile panel depending on the viewport size
    expect(
      (await getStreamActionFormLocatorsVisibilityStatuses(this.page)).filter(
        (locVisibilityStatus) => locVisibilityStatus
      ).length
    ).toBe(1);
  };

  closeStreamActionModal = async (actionName) => {
    // Click the close button
    await this.closeStreamActionModalBtnLoc.click();
    await this.page
      .getByTestId(`${actionName}-stream-action-form`)
      .waitFor({ state: 'hidden' });

    expect(
      (await getStreamActionFormLocatorsVisibilityStatuses(this.page)).filter(
        (locVisibilityStatus) => locVisibilityStatus
      ).length
    ).toBe(0);
  };

  saveFormData = async ({ expectedOutputStr } = {}) => {
    await this.saveFormDataBtnLoc.click();

    const localStorage = await this.page.getLocalStorage();
    const userKey = `user:${this.username}`;
    const userData = localStorage.find(({ name }) => name === userKey);
    // Removes the need to provide the expected output every time this function is called
    const expectedDataStr =
      expectedOutputStr !== undefined ? expectedOutputStr : userData.value;

    expect(userData.value).toBe(expectedDataStr);
  };

  setActionDuration = async ({
    defaultDuration = '15',
    duration = '25',
    isPreFilled = false
  } = {}) => {
    const durationNumInputLoc = this.page.getByLabel('Duration');
    const durationRangeInputLoc = this.page.getByTestId(
      'streamManagerActionFormDuration-range-input'
    );
    if (!isPreFilled) {
      expect(durationNumInputLoc).toHaveValue(defaultDuration);
      expect(durationRangeInputLoc).toHaveValue(defaultDuration);

      await durationNumInputLoc.fill(duration);
    }

    expect(durationNumInputLoc).toHaveValue(duration);
    expect(durationRangeInputLoc).toHaveValue(duration);
  };

  fillFormTextField = async ({
    isPreFilled = false,
    label,
    placeholder,
    values = ['']
  } = {}) => {
    if (!label && !placeholder) return;

    const expectedCount = values.length;
    let locator;
    if (placeholder) locator = this.page.getByPlaceholder(placeholder);
    else locator = this.page.getByLabel(label);

    expect(await locator.count()).toBe(expectedCount);

    for (const [index, value] of values.entries()) {
      if (!isPreFilled) await locator.nth(index).fill(value);
      await expect(locator.nth(index)).toHaveValue(value);
    }
  };

  /**
   * When isPreFilled is set to true, assume the data comes from localStorage and perform assertions only.
   * @param {boolean} isPreFilled
   */
  completeQuizForm = async (isPreFilled = false) => {
    const question = 'What is the capital of Canada?';
    const answers = ['Vancouver', 'Ottawa', 'Toronto'];

    await this.openStreamActionModal('quiz');

    // Fill out the question
    await this.fillFormTextField({
      isPreFilled,
      placeholder: 'Question',
      values: [question]
    });

    // Fill out the answers
    await this.fillFormTextField({
      isPreFilled,
      placeholder: 'Answer',
      values: answers
    });

    // Select the correct answer
    const correctAnswerRadioBtnLoc = this.page.getByTestId(
      `streamManagerActionFormAnswers-${answers[1]}-radio-button`
    );
    if (!isPreFilled) await correctAnswerRadioBtnLoc.click();

    expect(
      await this.page
        .getByTestId(
          `streamManagerActionFormAnswers-${answers[0]}-radio-button`
        )
        .isChecked()
    ).toBeFalsy();
    expect(correctAnswerRadioBtnLoc.isChecked()).toBeTruthy();
    expect(
      await this.page
        .getByTestId(
          `streamManagerActionFormAnswers-${answers[2]}-radio-button`
        )
        .isChecked()
    ).toBeFalsy();

    // Set the duration
    await this.setActionDuration({ isPreFilled });
  };

  /**
   * When isPreFilled is set to true, assume the data comes from localStorage and perform assertions only.
   * @param {boolean} isPreFilled
   */
  completeProductForm = async (isPreFilled = false) => {
    const title = 'Sneakers';
    const price = '$250';
    const imageUrl = 'https://api.lorem.space/image/shoes?w=1024&h=1024';
    const description = "Your streamer's favorite sneakers";

    await this.openStreamActionModal('product');

    // Fill out the title
    await this.fillFormTextField({
      isPreFilled,
      label: 'Title',
      values: [title]
    });

    // Fill out the price
    await this.fillFormTextField({
      isPreFilled,
      label: 'Price',
      values: [price]
    });

    // Fill out the image URL
    await this.fillFormTextField({
      isPreFilled,
      label: 'Image URL',
      values: [imageUrl]
    });

    // Fill out the description
    await this.fillFormTextField({
      isPreFilled,
      label: 'Description',
      values: [description]
    });
  };

  /**
   * When isPreFilled is set to true, assume the data comes from localStorage and perform assertions only.
   * @param {boolean} isPreFilled
   */
  completeNoticeForm = async (isPreFilled = false) => {
    const title = '200k subs';
    const message = 'Yay 200k subs, thanks all!';

    await this.openStreamActionModal('notice');

    // Fill out the title
    await this.fillFormTextField({
      isPreFilled,
      placeholder: 'Title',
      values: [title]
    });

    // Fill out the message
    await this.fillFormTextField({
      isPreFilled,
      placeholder: 'Message',
      values: [message]
    });

    // Set the duration
    await this.setActionDuration({ isPreFilled });
  };
  /* Stream Actions Interactions - END */

  /* Chat Interactions - START */
  sendChatMessage = async (message) => {
    const composerLoc = await this.page.getByPlaceholder('Say something');

    await composerLoc.fill(message);
    await this.page.keyboard.press('Enter');

    const messageLoc = this.page.getByText(message);
    await expect(messageLoc).toBeVisible();
  };

  /**
   * Sends a message on behalf of a user. Can be used to simulate multiple clients connected to a chat room and sending messages.
   * @param {string} message
   * @param {string} token
   */
  populateChatMessage = async (message, token) => {
    const socket = await connectToWss(token);

    socket.send(
      JSON.stringify({
        Action: 'SEND_MESSAGE',
        RequestId: uuidv4(),
        Content: message
      })
    );

    const messageLoc = this.page.getByText(message);
    await expect(messageLoc).toBeVisible();
  };

  openChatMessagePopup = async (messageOrUsername) => {
    const messageLoc = this.page.getByText(messageOrUsername);

    await messageLoc.click();
    await this.chatPopupContainerLoc.waitFor({ state: 'visible' });
  };

  deleteMessage = async (message) => {
    await this.openChatMessagePopup(message);
    await this.page.getByText('Delete message').click();

    await expect(this.page.getByText(message)).toBeHidden();

    await expect(this.successNotifLoc).toBeVisible();
    await expect(this.successNotifLoc).toHaveText('Message removed');
  };

  banUser = async (username, token) => {
    await this.openChatMessagePopup(username);
    await this.page.getByText('Ban user').click();

    await this.page.getByTestId('modal').getByText('Ban user').click();

    const socket = await connectToWss(token);

    // Mock the IVS backend which normally broadcasts the message
    socket.send(
      JSON.stringify({
        Action: 'BAN_USER',
        RequestId: uuidv4(),
        Content: username
      })
    );

    await expect(this.successNotifLoc).toBeVisible();
    expect(await this.successNotifLoc.textContent()).toBe(
      'User banned from channel'
    );
  };
  /* Chat Interactions - END */

  /**
   * This function creates an API handler which will return the provided token as part of the response body.
   * It should be used for the `/channel/token/create` route.
   *
   * It can be used to create isolated chat rooms for each tests. See example usage in [streamManager.spec.js](../__tests__/streamManager.spec.js).
   * @param {string} token - Composed of the room name and the username, separated by the '|' character
   * @returns {Function} Create token API handler
   */
  createApiCreateTokenHandler = (token) => (route, request) => {
    if (request.method() === 'POST') {
      const sessionExpirationTime = new Date(
        Date.now() + 3600 * 1000 // One hour from now
      ).toISOString();
      const tokenExpirationTime = new Date(
        Date.now() + 60 * 1000 // One minute from now
      ).toISOString();

      route.fulfill({
        status: 200,
        body: JSON.stringify({
          token,
          capabilities: ['DELETE_MESSAGE', 'DISCONNECT_USER', 'SEND_MESSAGE'],
          sessionExpirationTime,
          tokenExpirationTime
        })
      });
    } else route.fallback();
  };

  #mockBanUser = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel/ban'),
      (route, request) => {
        if (request.method() === 'POST') {
          route.fulfill({ status: 200, body: JSON.stringify({}) });
        } else route.fallback();
      }
    );
  };
}

module.exports = StreamManagerPageModel;
