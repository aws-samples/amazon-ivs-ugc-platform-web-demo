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
          const viewerChannelArn = 'channel/viewer-trackingId';
          const testTitleSlug = getTestTitleSlug(title, projectName);

          await populateChatMessage(
            message,
            buildChatToken(testTitleSlug, viewerUsername)
          );
          await banUser(
            {
              username: viewerUsername,
              bannedUserChannelArn: viewerChannelArn
            },
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

    // This test is working locally when isolated. When all tests are run together, it times out. This will require further investigation.
    testWithoutNavigation.fixme(
      'after clicking the health status button, the user should be taken to the Stream Health page to monitor the live session',
      async ({
        page,
        context,
        streamManagerPage: {
          sharedUIComponents: { statusBarHealthStatusBtnLoc }
        }
      }) => {
        // To ensure that the stream health page is being opened in a new tab, the test asserts that the current page remains unchanged while a new tab is opened.
        const [newTab] = await Promise.all([
          context.waitForEvent('page'),
          statusBarHealthStatusBtnLoc.click()
        ]);

        // make sure the url is updated to the most recent stream session
        const updatedUrl = '/health/streamId-0';
        await newTab.goto(updatedUrl);
        await newTab.waitForURL(updatedUrl, { timeout: 6000 });

        expect(page).toHaveURL('/manager');
        expect(newTab).toHaveURL(updatedUrl);
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
