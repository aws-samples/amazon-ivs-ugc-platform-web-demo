// @ts-check
const { devices } = require('@playwright/test');
const path = require('path');

const PORT = process.env.PORT || 3000;

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
const config = {
  testDir: path.join(__dirname, '__tests__'),
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: path.join(__dirname, 'playwright-report') }
    ]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${PORT}`,
    /* Capture a screenshot after each test */
    screenshot: 'on',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    /* Tell all tests to load signed-in state from 'storageState.json'. */
    storageState: path.join(__dirname, 'storageState.json')
  },
  globalSetup: path.join(__dirname, 'global-setup'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          permissions: [
            'clipboard-read',
            'clipboard-write',
            'accessibility-events'
          ]
        }
      }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      contextOptions: {
        permissions: [
          'clipboard-read',
          'clipboard-write',
          'accessibility-events'
        ]
      }
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
      retries: 2
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        contextOptions: {
          permissions: [
            'clipboard-read',
            'clipboard-write',
            'accessibility-events'
          ]
        }
      },
      retries: 2
    }
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: path.join(__dirname, 'test-results'),

  /* Serve the production build locally before starting the tests */
  webServer: {
    command: `serve -s build -l ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 10 * 1000
  }
};

module.exports = config;
