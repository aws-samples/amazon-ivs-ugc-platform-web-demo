class SharedUIComponents {
  static #isInternalConstructing = false;

  /**
   * Adds common locators and assertions to a page model.
   *
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!SharedUIComponents.#isInternalConstructing) {
      throw new TypeError('SharedUIComponents is not constructable');
    }

    this.page = page;

    /* Tooltip component */
    this.tooltipLoc = page.getByTestId('tooltip-content');

    /* Status Bar component */
    this.statusBarComponentLoc = page.getByRole('status');
    this.statusBarTimerLoc = this.statusBarComponentLoc.getByRole('timer');
    this.statusBarConcurrentViewsLoc = this.statusBarComponentLoc.getByTestId(
      'status-item-concurrent-views'
    );
    this.statusBarHealthStatusLoc = this.statusBarComponentLoc.getByTestId(
      'status-item-health-status'
    );
    this.statusBarHealthStatusBtnLoc = this.statusBarComponentLoc.getByRole(
      'button',
      { name: 'Monitor the latest stream session' }
    );
    this.statusBarTooltipLoc = this.tooltipLoc.getByText('Concurrent views');
  }

  static create = (page) => {
    SharedUIComponents.#isInternalConstructing = true;
    const sharedUIComponents = new SharedUIComponents(page);
    SharedUIComponents.#isInternalConstructing = false;

    return sharedUIComponents;
  };
}

module.exports = SharedUIComponents;
