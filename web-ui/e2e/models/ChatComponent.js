// @ts-check
const { expect } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');

const { getCloudfrontURLRegex, connectToWss } = require('../utils');

class ChatComponent {
  static #isInternalConstructing = false;

  /**
   * Adds Chat functionality to a page model.
   *
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!ChatComponent.#isInternalConstructing) {
      throw new TypeError('ChatComponent is not constructable');
    }

    this.page = page;

    this.moderatingPillLoc = page.getByText('Moderating');
    this.chatPopupContainerLoc = page.getByTestId('chat-popup-container');
    this.successNotifLoc = page.getByTestId('success-notification');
    this.errorNotifLoc = page.getByTestId('error-notification');
  }

  static create = async (page) => {
    ChatComponent.#isInternalConstructing = true;
    const chatComponent = new ChatComponent(page);
    ChatComponent.#isInternalConstructing = false;

    await chatComponent.#mockBanUser();

    return chatComponent;
  };

  /* Chat Interactions - START */

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

  /**
   * Delete a message on behalf of a user. Can be used to simulate chat moderation from the viewer's point of view.
   * @param {string} message
   * @param {string} messageId - Can be retrieved from the `wsFramesReceived` list
   * @param {string} moderatorToken
   */
  sendDeleteMessageAction = async (message, messageId, moderatorToken) => {
    const socket = await connectToWss(moderatorToken);

    socket.send(
      JSON.stringify({
        Action: 'DELETE_MESSAGE',
        Id: messageId,
        RequestId: uuidv4(),
        Reason: 'Deleted by moderator'
      })
    );

    const messageLoc = this.page.getByText(message);
    await expect(messageLoc).toBeHidden();
  };

  /**
   * Bans a user on behalf of a moderator. Can be used to simulate chat moderation from the viewer's point of view.
   * @param {string} username
   * @param {string} moderatorToken
   */
  sendBanUserAction = async (username, moderatorToken) => {
    const socket = await connectToWss(moderatorToken);

    // Mock the IVS backend which normally broadcasts the message
    socket.send(
      JSON.stringify({
        Action: 'BAN_USER',
        RequestId: uuidv4(),
        Content: username,
        Reason: 'Kicked by moderator'
      })
    );
  };

  sendChatMessage = async (message) => {
    const composerLoc = await this.page.getByPlaceholder('Say something');

    await composerLoc.fill(message);
    await this.page.keyboard.press('Enter');

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

    this.sendBanUserAction(username, token);

    await expect(this.successNotifLoc).toBeVisible();
    await expect(this.successNotifLoc).toHaveText('User banned from channel');
  };
  /* Chat Interactions - END */

  /**
   * This function creates an API handler which will return the provided token as part of the response body.
   * It should be used for the `/channel/token/create` route.
   *
   * It can be used to create isolated chat rooms for each tests. See example usage in [streamManager.spec.js](../__tests__/streamManager.spec.js).
   * @param {string} token - Composed of the room name and the username, separated by the '|' character
   * @param {boolean} isModerator - Defines the permissions that should be attached to the token
   * @returns {Function} Create token API handler
   */
  createApiCreateTokenHandler =
    (token, isModerator = true) =>
    (route, request) => {
      if (request.method() === 'POST') {
        const sessionExpirationTime = new Date(
          Date.now() + 3600 * 1000 // One hour from now
        ).toISOString();
        const tokenExpirationTime = new Date(
          Date.now() + 60 * 1000 // One minute from now
        ).toISOString();
        const capabilities = ['SEND_MESSAGE', 'VIEW_MESSAGE'];

        if (isModerator) capabilities.push('DELETE_MESSAGE', 'DISCONNECT_USER');

        route.fulfill({
          status: 200,
          body: JSON.stringify({
            token,
            capabilities,
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

module.exports = ChatComponent;
