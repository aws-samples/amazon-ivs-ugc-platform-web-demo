const { expect } = require('@playwright/test');

class BasePageModel {
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

  navigate = async (path) => {
    const dest = path || this.route;
    await this.page.goto(dest);
    await expect(this.page).toHaveURL(this.baseURL + dest);
  };
}

module.exports = BasePageModel;
