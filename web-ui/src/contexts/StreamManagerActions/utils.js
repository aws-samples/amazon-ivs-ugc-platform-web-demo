import {
  AMAZON_PRODUCT_DATA_KEYS,
  DEFAULT_CELEBRATION_DURATION,
  DEFAULT_SELECTED_SORT_CATEGORY,
  NOTICE_DATA_KEYS,
  PRODUCT_DATA_KEYS,
  QUIZ_DATA_KEYS,
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../constants';

export const DEFAULT_STREAM_MANAGER_ACTIONS_STATE = {
  [STREAM_ACTION_NAME.QUIZ]: {
    [QUIZ_DATA_KEYS.QUESTION]: '',
    [QUIZ_DATA_KEYS.ANSWERS]: Array(
      STREAM_MANAGER_ACTION_LIMITS[STREAM_ACTION_NAME.QUIZ][
        QUIZ_DATA_KEYS.ANSWERS
      ].min
    ).fill(''),
    [QUIZ_DATA_KEYS.CORRECT_ANSWER_INDEX]: 0,
    [QUIZ_DATA_KEYS.DURATION]: 15
  },
  [STREAM_ACTION_NAME.PRODUCT]: {
    [PRODUCT_DATA_KEYS.TITLE]: '',
    [PRODUCT_DATA_KEYS.PRICE]: '',
    [PRODUCT_DATA_KEYS.IMAGE_URL]: '',
    [PRODUCT_DATA_KEYS.DESCRIPTION]: ''
  },
  [STREAM_ACTION_NAME.NOTICE]: {
    [NOTICE_DATA_KEYS.TITLE]: '',
    [NOTICE_DATA_KEYS.MESSAGE]: '',
    [NOTICE_DATA_KEYS.DURATION]: 15
  },
  [STREAM_ACTION_NAME.CELEBRATION]: { duration: DEFAULT_CELEBRATION_DURATION },
  [STREAM_ACTION_NAME.AMAZON_PRODUCT]: {
    [AMAZON_PRODUCT_DATA_KEYS.SELECTED_PRODUCT_INDEX]: 0,
    [AMAZON_PRODUCT_DATA_KEYS.SELECTED_SORT_CATEGORY]:
      DEFAULT_SELECTED_SORT_CATEGORY,
    [AMAZON_PRODUCT_DATA_KEYS.KEYWORD]: '',
    [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_CHOICE]: {},
    [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_OPTIONS]: [],
    [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_PAGE_NUMBER]: 1
  }
};
