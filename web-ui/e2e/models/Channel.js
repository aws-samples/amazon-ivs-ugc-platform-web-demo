// @ts-check
const { getCloudfrontURLRegex } = require('../utils');
const BasePageModel = require('./BasePageModel');
const ChatComponent = require('./ChatComponent');

const DEFAULT_STREAMER_USERNAME = 'john';
const DEFAULT_BANNED_CHANNEL_ARN = 'channel/trackingId';

class ChannelPageModel extends BasePageModel {
  static #isInternalConstructing = false;
  #isViewerBanned = false;
  #streamerUsername = DEFAULT_STREAMER_USERNAME;
  #streamerAvatar = 'bear';
  #streamerColor = 'green';

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    if (!ChannelPageModel.#isInternalConstructing) {
      throw new TypeError('ChannelPageModel is not constructable');
    }

    super(page, baseURL, `/${DEFAULT_STREAMER_USERNAME}`);

    this.chatLoadingSpinnerLoc = page
      .getByTestId('chat-component')
      .getByTestId('loading-spinner');
  }

  get streamerUsername() {
    return this.#streamerUsername;
  }

  set isViewerBanned(newIsViewerBanned) {
    this.#isViewerBanned = newIsViewerBanned;
  }

  static create = async (page, baseURL, options = {}) => {
    ChannelPageModel.#isInternalConstructing = true;
    const channelPage = new ChannelPageModel(page, baseURL);
    ChannelPageModel.#isInternalConstructing = false;

    channelPage.chatComponent = await ChatComponent.create(page);
    channelPage.bannedUserChannelArn = DEFAULT_BANNED_CHANNEL_ARN;
    await channelPage.#mockGetUserChannelData();
    await channelPage.init();

    const { shouldNavigateAfterCreate = true } = options;

    if (shouldNavigateAfterCreate) await channelPage.navigate();

    return channelPage;
  };

  #mockGetUserChannelData = async () => {
    await this.page.route(
      getCloudfrontURLRegex(`/channels/${this.#streamerUsername}`),
      (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              avatar: this.#streamerAvatar,
              color: this.#streamerColor,
              username: this.#streamerUsername,
              isViewerBanned: this.#isViewerBanned,
              ...(this.#isViewerBanned
                ? {}
                : { isLive: false, playbackUrl: 'playbackUrl' })
            })
          });
        } else route.fallback();
      }
    );
  };
}

module.exports = ChannelPageModel;
