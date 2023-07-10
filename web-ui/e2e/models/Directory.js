const { expect } = require('@playwright/test');

const BasePageModel = require('./BasePageModel');
const followedStreamersComponent = require('./followedStreamersComponent');

class DirectoryPageModel extends BasePageModel {
  static #isInternalConstructing = false;

  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} baseURL
   */
  constructor(page, baseURL) {
    if (!DirectoryPageModel.#isInternalConstructing) {
      throw new TypeError('DirectoryPageModel is not constructable');
    }

    super(page, baseURL, '/');

    // Locators
    this.emptyFollowersText = page.getByText('No channels followed');
    this.followerHeaderLoc = page.getByText('Following');
    this.followerLoadingSpinnerLoc = page.getByTestId('loading-spinner').nth(0);
    this.followersLoc = page.getByTestId('followed-user');
    this.followerLoc = this.followersLoc.nth(0);
    this.nextPageNavigatorLoc = page.getByLabel('Go to next page');
    this.prevPageNavigatorLoc = page.getByLabel('Go to previous page');
    this.tryAgainButtonLoc = page.getByText('Try again');
    this.noLiveStreamsAvailableText = page.getByText(
      'No live streams available'
    );
  }

  static create = async (page, baseURL, options = {}) => {
    DirectoryPageModel.#isInternalConstructing = true;
    const directoryPage = new DirectoryPageModel(page, baseURL);
    DirectoryPageModel.#isInternalConstructing = false;

    directoryPage.followedStreamersComponent =
      await followedStreamersComponent.create(page);

    await directoryPage.init();

    const { shouldNavigateAfterCreate = true } = options;

    if (shouldNavigateAfterCreate) await directoryPage.navigate();

    return directoryPage;
  };

  /* USER FLOW OPERATIONS */

  // Empty state
  loggedOutEmptyState = async () => {
    await expect(this.noLiveStreamsAvailableText).toBeVisible();
    // await expect(this.followerHeaderLoc).toBeHidden();
    await this.page.takeScreenshot('directory-empty-state-logged-out');
  };

  // Follower Tests

  loggedOutWithDirectoryState = async () => {
    await this.followerLoadingSpinnerLoc.waitFor({ state: 'hidden' });
    expect(await this.followersLoc.count()).toBe(6);
    await this.page.takeScreenshot('directory-followers-state-logged-in');
  };

  loggedInWithFollowersState = async () => {
    await this.followerLoadingSpinnerLoc.waitFor({ state: 'hidden' });
    expect(await this.followersLoc.count()).toBe(6);
    await this.page.takeScreenshot('directory-followers-state-logged-in');
  };

  navigateToFollowedUserChannel = async () => {
    await this.followerLoadingSpinnerLoc.waitFor({ state: 'hidden' });
    await this.followerLoc.click();
    await expect(this.page).toHaveURL(/.*mockUser/);
  };

  navigateToFollowedUserChannelKeyboard = async () => {
    await this.followerLoadingSpinnerLoc.waitFor({ state: 'hidden' });
    await this.followerLoc.press('Enter');
    await expect(this.page).toHaveURL(/.*mockUser/);
  };

  carouselButtonClickedStates = async () => {
    await this.followerLoadingSpinnerLoc.waitFor({ state: 'hidden' });
    await expect(this.nextPageNavigatorLoc).toBeEnabled();
    await expect(this.prevPageNavigatorLoc).toBeDisabled();
    this.nextPageNavigatorLoc.click();
    await this.page.takeScreenshot('follower-carousel-navigate-to-next-page');

    await expect(this.nextPageNavigatorLoc).toBeDisabled();
    await expect(this.prevPageNavigatorLoc).toBeEnabled();
  };

  carouselButtonKeyboardStates = async () => {
    await this.followerLoadingSpinnerLoc.waitFor({ state: 'hidden' });
    await expect(this.nextPageNavigatorLoc).toBeEnabled();
    await expect(this.prevPageNavigatorLoc).toBeDisabled();
    this.nextPageNavigatorLoc.press('Enter');

    await this.page.takeScreenshot(
      'follower-carousel-navigate-to-next-page-keyboard'
    );
    await expect(this.nextPageNavigatorLoc).toBeDisabled();
    await expect(this.prevPageNavigatorLoc).toBeEnabled();
  };

  carouselTabStates = async (isMobile) => {
    await this.followerLoadingSpinnerLoc.waitFor({ state: 'hidden' });
    const isEven = (num) => num % 2 === 0;
    expect(await this.followersLoc.count()).toBe(6);

    if (!isMobile) {
      // Loop through the elements and simulate tab keypress
      for (let i = 0; i < (await this.followersLoc.count()) - 1; i++) {
        const follower = this.followersLoc.nth(i);
        // Simulate tab key press
        await follower.press('Tab');
        if (isEven(i)) {
          await this.page.takeScreenshot(`follower-carousel-tabbing-${i}`);
        }
      }
      await this.page.takeScreenshot(`follower-carousel-last-page-tabbed`);
    }
  };
}

module.exports = DirectoryPageModel;
