// @ts-check
const { expect } = require('@playwright/test');

const { isValidUrl, getCloudfrontURLRegex } = require('../utils');

class BasePageModel {
  #resourcesCreated = false;
  #streamKeyValue = 'sk_mock-region_mock-stream-key';
  #username = 'testUser';

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

  set streamKeyValue(newStreamKeyValue) {
    this.#streamKeyValue = newStreamKeyValue;
  }

  init = async () => {
    await this.#mockGetUser();
    await this.#mockGetUserChannelData();
    await this.#mockGetChannels();
    await this.#mockCreateResources();

    const localStorage = await this.page.getLocalStorage();
    const { value: resourcesCreated = 'false' } =
      localStorage?.find(({ name }) => name === 'resourcesCreated') || {};
    this.#resourcesCreated = resourcesCreated === 'true';

    await this.page.emulateMedia({ colorScheme: 'light' });

    await this.navigate();
  };

  navigate = async (path) => {
    let url = path || this.route;

    if (!isValidUrl(url)) {
      url = this.baseURL + url;
    }

    await this.page.goto(url);
    await expect(this.page).toHaveURL(url);
  };

  /* MOCK API HELPERS */

  #mockGetUser = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel'),
      (route, request) => {
        if (request.method() === 'GET') {
          if (this.#resourcesCreated) {
            route.fulfill({
              status: 200,
              body: JSON.stringify({
                channelResourceId: 'mockChannelId',
                ingestEndpoint:
                  'rtmps://mockChannelId.global-contribute.live-video.net:443/app/',
                playbackUrl:
                  'https://mockChannelId.mock-region.playback.live-video.net/api/video/v1/mock-region.mock-account-id.channel.mockChannelId.m3u8',
                streamKeyValue: this.#streamKeyValue,
                username: this.#username,
                color: 'salmon',
                avatar: 'bird'
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
