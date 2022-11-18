// @ts-check
const { expect } = require('@playwright/test');
const { extendTestFixtures, noop } = require('../utils');
const { StreamManagerPageModel } = require('../models');
const expectedOutputStrMap = require('../__mocks__/encodedStreamManagerData.json');

const test = extendTestFixtures([
  { name: 'streamManagerPage', PageModel: StreamManagerPageModel }
]);

const QUIZ = 'quiz';
const PRODUCT = 'product';
const NOTICE = 'notice';
const CELEBRATION = 'celebration';
const MODAL_STREAM_ACTION_NAMES = [QUIZ, PRODUCT, NOTICE];
const STREAM_ACTION_NAMES = [...MODAL_STREAM_ACTION_NAMES, CELEBRATION];

test.describe('Stream Manager Page', () => {
  test.describe('General Cases', () => {
    test('should have four stream actions buttons and the moderation pill', async ({
      streamManagerPage: { getActionButtonLocator, moderatingPillLoc },
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
              closeStreamActionModal,
              moderatingPillLoc,
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
              openStreamActionModal,
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
  });
});
