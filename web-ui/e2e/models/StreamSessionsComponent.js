const {
  generateMockStreamSession,
  generateMockStreamSessions
} = require('../__mocks__/generateMockStreamSessions');
const { getCloudfrontURLRegex } = require('../utils');

class StreamSessionsComponent {
  static #isInternalConstructing = false;
  #streamsSessions = [];

  /**
   * Adds functionalities related to mocking offline and online stream sessions to a page model.
   *
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!StreamSessionsComponent.#isInternalConstructing) {
      throw new TypeError('StreamSessionsComponent is not constructable');
    }

    this.page = page;
  }

  static create = async (page) => {
    StreamSessionsComponent.#isInternalConstructing = true;
    const streamSessionsComponent = new StreamSessionsComponent(page);
    StreamSessionsComponent.#isInternalConstructing = false;

    await streamSessionsComponent.#mockGetStreamSessions();
    await streamSessionsComponent.#mockGetStreamSessionData();

    return streamSessionsComponent;
  };

  updateStreamSessions = (streamSessionsCount = 0, withLiveSession = false) => {
    this.#streamsSessions = generateMockStreamSessions(
      streamSessionsCount,
      withLiveSession
    );
  };

  /* MOCK API HELPERS (INTERNAL) */
  #mockGetStreamSessions = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/metrics/mockChannelId/streamSessions', {
        nextToken: ''
      }),
      (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              maxResults: 50,
              streamSessions: this.#streamsSessions
            })
          });
        } else route.fallback();
      }
    );
  };

  #mockGetStreamSessionData = async () => {
    const routePattern = '/metrics/mockChannelId/streamSessions/(.+)';

    await this.page.route(
      getCloudfrontURLRegex(routePattern),
      (route, request) => {
        const [, streamSessionId] = request.url().match(routePattern);
        const selectedStreamSession = this.#streamsSessions.find(
          (streamSession) => streamSession.streamId === streamSessionId
        );

        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            body: JSON.stringify(
              generateMockStreamSession(selectedStreamSession)
            )
          });
        } else route.fallback();
      }
    );
  };
}

module.exports = StreamSessionsComponent;
