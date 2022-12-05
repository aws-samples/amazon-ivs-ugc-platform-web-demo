// @ts-check
const { expect } = require('@playwright/test');

const {
  extendTestFixtures,
  getCloudfrontURLRegex,
  getTestTitleSlug,
  noop
} = require('../utils');
const { StreamManagerPageModel } = require('../models');
const expectedOutputStrMap = require('../__mocks__/encodedStreamManagerData.json');

const test = extendTestFixtures({
  name: 'streamManagerPage',
  PageModel: StreamManagerPageModel
});

const testWithoutNavigation = extendTestFixtures(
  { name: 'streamManagerPage', PageModel: StreamManagerPageModel },
  { shouldNavigateAfterCreate: false }
);

const QUIZ = 'quiz';
const PRODUCT = 'product';
const NOTICE = 'notice';
const CELEBRATION = 'celebration';
const MODAL_STREAM_ACTION_NAMES = [QUIZ, PRODUCT, NOTICE];
const STREAM_ACTION_NAMES = [...MODAL_STREAM_ACTION_NAMES, CELEBRATION];

const buildChatToken = (roomName, username) => [roomName, username].join('|');

test.describe('Stream Manager Page', () => {
  const createTokenRouteHandlers = {};
  const createTokenRoute = getCloudfrontURLRegex('/channel/chatToken/create');

  test.beforeEach(
    async (
      { streamManagerPage, page },
      { title, project: { name: projectName } }
    ) => {
      const {
        chatComponent: { createApiCreateTokenHandler },
        username
      } = streamManagerPage;
      const testTitleSlug = getTestTitleSlug(title, projectName);
      const createTokenRouteHandler =
        // This ensures that every test gets its own independent chatroom
        createApiCreateTokenHandler(buildChatToken(testTitleSlug, username));
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

  test.describe('General Cases', () => {
    test('should display four stream actions buttons and the moderation pill', async ({
      streamManagerPage: {
        chatComponent: { moderatingPillLoc },
        getActionButtonLocator
      },
      page
    }) => {
      for (const streamActionName of STREAM_ACTION_NAMES) {
        const streamActionNameLocator = await getActionButtonLocator(
          streamActionName
        );

        expect(streamActionNameLocator).toBeVisible();
      }

      await moderatingPillLoc.waitFor({ state: 'visible' });
      await page.takeScreenshot('initial-page-load');
    });

    test.describe('Action Modals', () => {
      for (const streamActionName of MODAL_STREAM_ACTION_NAMES) {
        test.describe('Shared tests', () => {
          test(`should open and close the ${streamActionName} modal`, async ({
            streamManagerPage: {
              chatComponent: { moderatingPillLoc },
              closeStreamActionModal,
              openStreamActionModal
            },
            page
          }) => {
            // Wait for the moderating pill to be visible for consistent screenshots
            await moderatingPillLoc.waitFor({ state: 'visible' });
            await openStreamActionModal(streamActionName);
            await page.takeScreenshot(`${streamActionName}-action-modal-open`);

            // Wait for the moderating pill to be hidden for consistent screenshots
            await moderatingPillLoc.waitFor({ state: 'hidden' });
            await closeStreamActionModal(streamActionName);
            await page.takeScreenshot(
              `${streamActionName}-action-modal-closed`
            );
          });

          test(`should complete the ${streamActionName} form and save the data`, async ({
            streamManagerPage: {
              completeNoticeForm,
              completeProductForm,
              completeQuizForm,
              saveFormData
            },
            page
          }) => {
            if (streamActionName === QUIZ) await completeQuizForm();
            else if (streamActionName === PRODUCT) await completeProductForm();
            else if (streamActionName === NOTICE) await completeNoticeForm();

            await page.takeScreenshot(
              `${streamActionName}-action-modal-completed-form`
            );

            const expectedOutputStr = expectedOutputStrMap[streamActionName];
            await saveFormData({ expectedOutputStr });
          });

          test(`should load the ${streamActionName} data from localStorage`, async ({
            streamManagerPage: {
              completeNoticeForm,
              completeProductForm,
              completeQuizForm,
              saveFormData
            },
            page
          }) => {
            let completeFormFn = noop;
            if (streamActionName === QUIZ) completeFormFn = completeQuizForm;
            else if (streamActionName === PRODUCT)
              completeFormFn = completeProductForm;
            else if (streamActionName === NOTICE)
              completeFormFn = completeNoticeForm;

            await completeFormFn();
            await saveFormData();

            await page.reload();
            // Assert that the form data against what was saved in localStorage
            await completeFormFn(true);
            await page.takeScreenshot(
              `${streamActionName}-action-modal-prefilled-form`
            );
          });
        });

        test.describe('Action-specific tests', () => {
          if (streamActionName === QUIZ) {
            test('should add and remove an answer', async ({
              streamManagerPage: { completeQuizForm },
              page
            }) => {
              await completeQuizForm();

              const answersInputLoc = page.getByPlaceholder('Answer');
              expect(await answersInputLoc.count()).toBe(3);

              // Add an answer
              const addAnswerBtnLoc = page.getByText('Add answer');
              await addAnswerBtnLoc.click();
              expect(await answersInputLoc.count()).toBe(4);

              const tempAnswer = 'Paris';
              await answersInputLoc.last().fill(tempAnswer);
              await expect(answersInputLoc.last()).toHaveValue(tempAnswer);
              await page.takeScreenshot('quiz-action-modal-add-answer');

              // Remove an answer
              const removeAnswerBtnLoc = page.getByTestId(
                `delete-${tempAnswer}-item-button`
              );
              await removeAnswerBtnLoc.click();
              expect(await answersInputLoc.count()).toBe(3);
              await page.takeScreenshot('quiz-action-modal-remove-answer');
            });
          }
        });
      }
    });

    test.describe('Chat', () => {
      const message = 'Hello world!';

      test.describe('Single-user chat', () => {
        test('a moderator sends a message and receives it', async ({
          streamManagerPage: {
            chatComponent: { moderatingPillLoc, sendChatMessage }
          },
          page
        }) => {
          await moderatingPillLoc.waitFor({ state: 'visible' });

          await sendChatMessage(message);

          await moderatingPillLoc.waitFor({ state: 'hidden' });
          await expect(page.getByText(message)).toBeVisible();
          await page.takeScreenshot(
            'chat-moderator-sends-message-moderator-receives-message'
          );
        });

        test('a moderator sends a message and then deletes it', async ({
          streamManagerPage: {
            chatComponent: { deleteMessage, moderatingPillLoc, sendChatMessage }
          },
          page
        }) => {
          await moderatingPillLoc.waitFor({ state: 'visible' });
          await sendChatMessage(message);

          await deleteMessage(message);

          expect(
            await page.getByTestId('chatline-message-removed').count()
          ).toBe(1);
          await page.takeScreenshot(
            'chat-moderator-sends-message-moderator-deletes-message'
          );
        });
      });

      test.describe('Multi-user chat', () => {
        test('a moderator deletes a message sent by a viewer', async ({
          streamManagerPage: {
            chatComponent: {
              deleteMessage,
              moderatingPillLoc,
              populateChatMessage
            },
            username
          },
          page
        }, { title, project: { name: projectName } }) => {
          await moderatingPillLoc.waitFor({ state: 'visible' });

          const message = 'Hi, this is john!';

          await populateChatMessage(
            message,
            buildChatToken(getTestTitleSlug(title, projectName), username)
          );
          await deleteMessage(message);

          expect(
            await page.getByTestId('chatline-message-removed').count()
          ).toBe(1);
          await page.takeScreenshot(
            'chat-viewer-sends-message-moderator-deletes-message'
          );
        });

        test('a moderator bans a viewer', async ({
          streamManagerPage: {
            chatComponent: { banUser, moderatingPillLoc, populateChatMessage },
            username
          },
          page
        }, { title, project: { name: projectName } }) => {
          await moderatingPillLoc.waitFor({ state: 'visible' });

          const message = 'Hi, this is john!';
          const viewerUsername = 'john';
          const testTitleSlug = getTestTitleSlug(title, projectName);

          await populateChatMessage(
            message,
            buildChatToken(testTitleSlug, viewerUsername)
          );
          await banUser(
            viewerUsername,
            buildChatToken(testTitleSlug, username)
          );

          expect(await page.getByText(message).count()).toBe(0);
          await page.takeScreenshot(
            'chat-viewer-sends-message-moderator-bans-viewer'
          );
        });
      });
    });
  });

  testWithoutNavigation.describe('Offline State', () => {
    testWithoutNavigation.beforeEach(
      async ({
        streamManagerPage: {
          navigate,
          streamSessionsComponent: { updateStreamSessions }
        }
      }) => {
        // Populate one offline session
        updateStreamSessions(1);

        await navigate();
      }
    );

    testWithoutNavigation(
      'should display the empty status bar and offline floating player module',
      async ({
        isMobile,
        page,
        streamManagerPage: {
          chatComponent: { moderatingPillLoc },
          sharedUIComponents: {
            statusBarConcurrentViewsLoc,
            statusBarHealthStatusLoc,
            statusBarTimerLoc
          }
        }
      }) => {
        await moderatingPillLoc.waitFor({ state: 'visible' });
        // Assert initial page load
        await page.takeScreenshot('initial-page-load');

        // Assert the status bar content
        await expect(statusBarTimerLoc).toHaveText('--:--:--');
        await expect(statusBarConcurrentViewsLoc).toHaveText('------');
        await expect(statusBarHealthStatusLoc).toHaveText('------');

        // Assert that the text inside the floating player is correct
        const floatingPlayerHeaderLoc = page
          .getByTestId('floating-player')
          .getByText('Your channel is offline');

        if (!isMobile) {
          expect(floatingPlayerHeaderLoc).toBeVisible();
        }
      }
    );
  });

  test.describe('Live State', () => {
    testWithoutNavigation.beforeEach(
      async ({
        streamManagerPage: {
          navigate,
          streamSessionsComponent: { updateStreamSessions }
        }
      }) => {
        // Populate one live session
        updateStreamSessions(1, true);

        await navigate();
      }
    );

    testWithoutNavigation(
      'should display the correct data inside the status bar and inside the floating player module',
      async ({
        isMobile,
        page,
        streamManagerPage: {
          chatComponent: { moderatingPillLoc },
          sharedUIComponents: {
            floatingPlayerLoc,
            statusBarConcurrentViewsLoc,
            statusBarHealthStatusLoc,
            statusBarTimerLoc
          }
        }
      }) => {
        await moderatingPillLoc.waitFor({ state: 'visible' });
        // Assert initial page load
        await page.takeScreenshot('initial-page-load-live', {
          mask: [
            statusBarTimerLoc,
            page.getByTestId('floating-player-video-container')
          ]
        });

        if (!isMobile) {
          await expect(
            floatingPlayerLoc.getByText('Your channel is offline')
          ).toBeHidden();
          // Assert that the live pill inside the floating player is present
          await expect(floatingPlayerLoc.getByText('live')).toBeVisible();
        }

        // Assert the status bar content
        await expect(statusBarTimerLoc).toHaveText(/00:\d{2}:\d{2}/);
        await expect(statusBarConcurrentViewsLoc).toHaveText('1');
        await expect(statusBarHealthStatusLoc).toHaveText('Stable');
      }
    );

    testWithoutNavigation(
      'after clicking the health status button, the user should be taken to the Stream Health page to monitor the live session',
      async ({
        page,
        streamManagerPage: {
          sharedUIComponents: { statusBarHealthStatusBtnLoc }
        }
      }) => {
        // Assert that clicking on the button takes you to monitor the live session on Stream Health
        await statusBarHealthStatusBtnLoc.click();

        await expect(page).toHaveURL('/health/streamId-0');
      }
    );

    testWithoutNavigation(
      'after clicking the health status button in the floating player module, the user should be taken to the Stream Health page to monitor the live session',
      async ({
        isMobile,
        page,
        streamManagerPage: {
          sharedUIComponents: { floatingPlayerLoc }
        }
      }) => {
        // There is no floating player module on mobile
        if (isMobile) return;

        // Assert that clicking on the button takes you to monitor the live session on Stream Health
        await floatingPlayerLoc
          .getByRole('button', { name: 'View stream session' })
          .click();

        await expect(page).toHaveURL('/health/streamId-0');
      }
    );

    // This test doesn't seem to be working with Firefox and will need to be investigated further.
    testWithoutNavigation.fixme(
      'should show tooltip for live session in session status bar',
      async ({
        streamManagerPage: {
          sharedUIComponents: {
            statusBarConcurrentViewsLoc,
            statusBarTooltipLoc
          }
        },
        isMobile
      }) => {
        isMobile
          ? await statusBarConcurrentViewsLoc.click()
          : await statusBarConcurrentViewsLoc.hover();
        await expect(statusBarTooltipLoc).toBeVisible();
      }
    );
  });
});
