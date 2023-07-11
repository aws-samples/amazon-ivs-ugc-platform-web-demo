const { getCloudfrontURLRegex } = require('../utils');
const mockFollowers = require('../__mocks__/followerList.json');

class followedStreamersComponent {
  static #isInternalConstructing = false;
  #followedUsers = mockFollowers;

  /**
   * Adds functionalities related to mocking offline and online followers.
   *
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!followedStreamersComponent.#isInternalConstructing) {
      throw new TypeError('followedStreamersComponent is not constructable');
    }

    this.page = page;
  }

  static create = async (page) => {
    followedStreamersComponent.#isInternalConstructing = true;
    const followUsersComponent = new followedStreamersComponent(page);
    followedStreamersComponent.#isInternalConstructing = false;

    await followUsersComponent.#mockGetFollowedStreamers();

    return followUsersComponent;
  };

  /* MOCK API HELPERS (INTERNAL) */
  #mockGetFollowedStreamers = async () => {
    await this.page.route(
      getCloudfrontURLRegex('/channel/followingList'),
      (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              maxResults: 50,
              channels: this.#followedUsers
            })
          });
        } else route.fallback();
      }
    );
  };
}

module.exports = followedStreamersComponent;
