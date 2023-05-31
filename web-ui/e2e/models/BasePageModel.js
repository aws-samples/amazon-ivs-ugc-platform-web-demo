// @ts-check
const { isValidUrl, getCloudfrontURLRegex } = require('../utils');

class BasePageModel {
  #resourcesCreated = false;
  #streamKeyValue = 'sk_mock-region_mock-stream-key';
  #username = 'testUser';
  #avatar = 'bird';
  #color = 'salmon';
  #trackingId = 'channelArn/trackingId';

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   * @param {string} route
   */
  constructor(page, baseURL, route) {
    this.page = page;
    this.baseURL = baseURL;
    this.route = route;
  }

  get userResourcesCreated() {
    return this.#resourcesCreated;
  }

  get username() {
    return this.#username;
  }

  set username(newUsername) {
    this.#username = newUsername;
  }

  set streamKeyValue(newStreamKeyValue) {
    this.#streamKeyValue = newStreamKeyValue;
  }

  init = async () => {
    await this.#mockCreateResources();
    await this.#mockGetChannels();
    await this.#mockGetUser();
    await this.#mockGetUserChannelData();

    const localStorage = await this.page.getLocalStorage();
    const { value: resourcesCreated = 'false' } =
      localStorage?.find(({ name }) => name === 'resourcesCreated') || {};
    this.#resourcesCreated = resourcesCreated === 'true';

    await this.page.emulateMedia({ colorScheme: 'light' });
  };

  navigate = async (path, assertionPath) => {
    const getValidUrl = (url) => {
      if (!isValidUrl(url)) {
        url = this.baseURL + url;
      }
      return url;
    };
    const url = getValidUrl(path || this.route);
    const assertionUrl = getValidUrl(assertionPath || url);

    await this.page.goto(url);
    await this.page.waitForURL(assertionUrl, { timeout: 5000 });

    // This ensures that we wait for the fonts to be downloaded before testing anything.
    // It helps keeping screenshots consistent.
    await this.page.waitForFunction(async () => await document.fonts.ready);
  };

  /* MOCK API HELPERS */

  #mockGetUser = async () => {
    const ingestEndpoint = 'mockChannelId.global-contribute.live-video.net';

    await this.page.route(
      getCloudfrontURLRegex('/channel'),
      (route, request) => {
        if (request.method() === 'GET') {
          if (this.#resourcesCreated) {
            route.fulfill({
              status: 200,
              body: JSON.stringify({
                channelResourceId: 'mockChannelId',
                ingestServerUrl: `rtmps://${ingestEndpoint}:443/app/`,
                ingestEndpoint,
                playbackUrl:
                  'https://mockChannelId.mock-region.playback.live-video.net/api/video/v1/mock-region.mock-account-id.channel.mockChannelId.m3u8',
                streamKeyValue: this.#streamKeyValue,
                username: this.#username,
                color: this.#color,
                avatar: this.#avatar,
                trackingId: this.#trackingId
              })
            });
          } else {
            route.fulfill({
              status: 500,
              body: JSON.stringify({ __type: 'UnexpectedException' })
            });
          }
        } else route.fallback();
      }
    );
  };

  #mockGetUserChannelData = async () => {
    await this.page.route(
      getCloudfrontURLRegex(`/channels/${this.#username}`),
      (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              username: this.#username,
              isViewerBanned: false
            })
          });
        } else route.fallback();
      }
    );
  };

  #mockGetChannels = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channels', { isLive: true }),
      (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              channels: [],
              maxResults: 50
            })
          });
        } else route.fallback();
      }
    );
  };

  #mockCreateResources = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel/resources/create'),
      (route, request) => {
        if (request.method() === 'POST') {
          this.#resourcesCreated = true;
          route.fulfill({
            status: 200,
            body: JSON.stringify({})
          });
        } else route.fallback();
      }
    );
  };
}

module.exports = BasePageModel;
