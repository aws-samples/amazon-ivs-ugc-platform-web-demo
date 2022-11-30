// @ts-check
const { expect } = require('@playwright/test');

const {
  getTestTitleSlug,
  getCloudfrontURLRegex,
  extendTestFixtures
} = require('../utils');
const { ChannelPageModel } = require('../models');

const test = extendTestFixtures({
  name: 'channelPage',
  PageModel: ChannelPageModel
});

const buildChatToken = (roomName, username) => [roomName, username].join('|');

test.describe('Channel Page', () => {
  const createTokenRouteHandlers = {};
  const createTokenRoute = getCloudfrontURLRegex('/channel/chatToken/create');

  test.beforeEach(
    async (
      { channelPage, page },
      { title, project: { name: projectName } }
    ) => {
      const {
        chatComponent: { createApiCreateTokenHandler },
        username
      } = channelPage;
      const testTitleSlug = getTestTitleSlug(title, projectName);
      const createTokenRouteHandler = createApiCreateTokenHandler(
        buildChatToken(testTitleSlug, username),
        false
      );
      createTokenRouteHandlers[testTitleSlug] = createApiCreateTokenHandler;

      await page.route(createTokenRoute, createTokenRouteHandler);
    }
  );

  test.afterEach(({ page }, { title, project: { name: projectName } }) => {
    page.unroute(
      createTokenRoute,
      createTokenRouteHandlers[getTestTitleSlug(title, projectName)]
    );
  });

  test.describe('Chat', () => {
    const message = 'Hello world!';

    test('a viewer sends a message and receives it', async ({
      channelPage: {
        chatComponent: { chatPopupContainerLoc, sendChatMessage },
        chatLoadingSpinnerLoc
      },
      page
    }) => {
      // Wait for chat connection
      await chatLoadingSpinnerLoc.waitFor({ state: 'hidden' });
      await page.takeScreenshot('initial-page-load');

      await sendChatMessage(message);

      // The message that was sent should have been received by all clients including the sender
      const messageLoc = page.getByText(message);
      await expect(messageLoc).toBeVisible();

      await messageLoc.click();
      // Viewer should not be allowed to moderate messages on a channel
      await expect(chatPopupContainerLoc).toBeHidden();
      await page.takeScreenshot(
        'chat-viewer-sends-message-viewer-receives-message'
      );
    });

    test('a viewer sends a message and a moderator deletes it', async ({
      channelPage: {
        chatComponent: {
          errorNotifLoc,
          sendChatMessage,
          sendDeleteMessageAction
        },
        chatLoadingSpinnerLoc,
        username
      },
      page
    }, { title, project: { name: projectName } }) => {
      // Wait for chat connection
      await chatLoadingSpinnerLoc.waitFor({ state: 'hidden' });
      await sendChatMessage(message);

      // Gets the message ID corresponding to the message
      const { wsFramesReceived } = page;
      const messageId = wsFramesReceived.find(
        (wsFrameReceived) => wsFrameReceived.Content === message
      ).Id;
      const moderatorToken = buildChatToken(
        getTestTitleSlug(title, projectName),
        username
      );

      // Simulate message deletion by a moderator
      await sendDeleteMessageAction(message, messageId, moderatorToken);

      await expect(errorNotifLoc).toHaveText('Your message was removed');
      expect(await page.getByTestId('chatline-message-removed').count()).toBe(
        1
      );
      await page.takeScreenshot(
        'chat-viewer-sends-message-moderator-deletes-message'
      );
    });

    test('a viewer sends a message and a moderator bans the viewer', async ({
      channelPage,
      page
    }, { title, project: { name: projectName } }) => {
      const {
        chatComponent: { errorNotifLoc, sendChatMessage, sendBanUserAction },
        chatLoadingSpinnerLoc,
        streamerUsername,
        username
      } = channelPage;
      // Wait for chat connection
      await chatLoadingSpinnerLoc.waitFor({ state: 'hidden' });
      await sendChatMessage(message);

      const moderatorToken = buildChatToken(
        getTestTitleSlug(title, projectName),
        streamerUsername
      );

      // Simulate user ban by a moderator
      await sendBanUserAction(username, moderatorToken);
      channelPage.isViewerBanned = true;

      // Wait for updated channel data with updated `isViewerBanned` value
      await page.waitForResponse(
        getCloudfrontURLRegex(`/channels/${streamerUsername}`)
      );

      await expect(errorNotifLoc).toHaveText('You have been banned');
      await expect(page.getByText(message)).toBeHidden();
      const composerLoc = page.getByPlaceholder(
        'You are banned from this channel'
      );
      await expect(composerLoc).toBeVisible();
      await expect(composerLoc).toBeDisabled();
      await page.takeScreenshot(
        'chat-viewer-sends-message-moderator-bans-viewer'
      );
    });
  });
});
