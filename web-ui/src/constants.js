import { streamManager as $streamManagerContent } from './content';

/**
 * MISC
 */
export const NO_DATA_VALUE = '----';

export const CHANNEL_TYPE = {
  BASIC: 'BASIC',
  STANDARD: 'STANDARD',
  ADVANCED_SD: 'ADVANCED_SD',
  ADVANCED_HD: 'ADVANCED_HD'
};

/**
 * APP
 */
export const BREAKPOINTS = { xxs: 0, xs: 331, sm: 576, md: 768, lg: 990 };

export const MAIN_THEME_COLOR = '#292b32';

export const DEFAULT_NOTIF_TIMEOUT = 3000; // ms

export const CHANNEL_DATA_REFRESH_INTERVAL = 5000; // 5 seconds

/**
 * CHAT
 */
export const CHAT_MESSAGE_EVENT_TYPES = {
  SEND_MESSAGE: 'SEND_MESSAGE',
  START_POLL: 'START_POLL',
  END_POLL: 'END_POLL',
  SUBMIT_VOTE: 'SUBMIT_VOTE',
  SEND_VOTE_STATS: 'SEND_VOTE_STATS',
  HEART_BEAT: 'HEART_BEAT'
};
export const BANNED_USERNAME_CHANNEL_ID_SEPARATOR = 'channel/';
export const MAX_RECONNECT_ATTEMPTS = 7;

export const CHAT_LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  ERROR: 'error'
};

/**
 * DEBUG
 */
export const USE_MOCKS = false;

export const RESTRICTED_PROD_CONSOLE_TYPES = ['log', 'info'];

/**
 * EXCEPTIONS
 */
export const ALIAS_EXISTS_EXCEPTION = 'AliasExistsException';
export const EMAIL_EXISTS_EXCEPTION = 'EmailExistsException';
export const LIMIT_EXCEEDED_EXCEPTION = 'LimitExceededException';
export const NOT_AUTHORIZED_EXCEPTION = 'NotAuthorizedException';
export const RESERVED_USERNAME_EXCEPTION = 'ReservedUsernameException';
export const SORT_PRODUCTS_EXCEPTION = 'SortProductsException';
export const TOO_MANY_REQUESTS_EXCEPTION = 'TooManyRequestsException';
export const UNEXPECTED_EXCEPTION = 'UnexpectedException';
export const USER_LAMBDA_VALIDATION_EXCEPTION = 'UserLambdaValidationException';
export const USER_NOT_FOUND_EXCEPTION = 'UserNotFoundException';
export const USERNAME_EXISTS_EXCEPTION = 'UsernameExistsException';

export const GENERIC_ERROR_MESSAGE = 'Unexpected Error Occurred';

export const ERROR_KEY_MAP = {
  [USERNAME_EXISTS_EXCEPTION]: {
    type: 'input_error--username',
    contentKey: 'username_taken'
  },
  [RESERVED_USERNAME_EXCEPTION]: {
    type: 'input_error--username',
    contentKey: 'unavailable_username'
  },
  [ALIAS_EXISTS_EXCEPTION]: {
    type: 'input_error--username',
    contentKey: 'username_taken'
  },
  [EMAIL_EXISTS_EXCEPTION]: {
    type: 'input_error--email',
    contentKey: 'unavailable_email'
  },
  [USER_NOT_FOUND_EXCEPTION]: {
    type: 'notification',
    contentKey: 'incorrect_username_or_password'
  },
  [NOT_AUTHORIZED_EXCEPTION]: {
    type: 'notification',
    contentKey: 'incorrect_username_or_password'
  },
  [LIMIT_EXCEEDED_EXCEPTION]: {
    type: 'notification',
    contentKey: 'attempt_limit_exceeded'
  },
  [UNEXPECTED_EXCEPTION]: {
    type: 'notification',
    contentKey: 'unexpected_error_occurred'
  }
};

export const KEY_MAP_REGEX = new RegExp(
  `${Object.keys(ERROR_KEY_MAP).join('|')}`
);

/**
 * CHANNELS
 */
export const USER_MANAGEMENT_THEME_COLOR = '#000000';

export const PROFILE_COLORS = [
  'blue',
  'green',
  'lavender',
  'purple',
  'salmon',
  'turquoise',
  'yellow'
];
export const DEFAULT_PROFILE_VIEW_TRANSITION = { type: 'tween', duration: 0.4 };

export const MAXIMUM_IMAGE_FILE_SIZE = { avatar: 1, banner: 5 }; // Sizes are in MB
export const SUPPORTED_IMAGE_FILE_FORMATS = [['jpg', 'jpeg'], 'png'];

/**
 * STREAM HEALTH
 */
export const STREAM_SESSIONS_REFRESH_INTERVAL = 15000; // 15 seconds
export const STREAM_SESSION_DATA_REFRESH_INTERVAL = 5000; // 5 seconds

export const CONCURRENT_VIEWS = 'ConcurrentViews';
export const INGEST_FRAMERATE = 'IngestFramerate';
export const INGEST_VIDEO_BITRATE = 'IngestVideoBitrate';
export const KEYFRAME_INTERVAL = 'KeyframeInterval';

/**
 * PLAYER
 */
export const VOLUME_MEDIAN = 50;
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 100;

export const MODERATOR_PILL_TIMEOUT = 5000; // ms

export const COMPOSER_MAX_CHARACTER_LENGTH = 500;
export const COMPOSER_RATE_LIMIT_BLOCK_TIME_MS = 2000; // 2 seconds

/**
 * STREAM MANAGER POLL ACTION
 */

export const PROFILE_COLORS_WITH_WHITE_TEXT = ['green', 'blue'];
export const NUM_MILLISECONDS_TO_BLOCK = 2000;
export const NUM_MILLISECONDS_TO_SHOW_POLL_RESULTS = 10000;
export const SHOW_POLL_RESULTS_ANIMATION_DURATION = 200; // ms
/*
To handle undelivered SDK messages, we follow this approach: if the "end poll" message is not received, 
we wait an additional 2 seconds before removing the poll forcefully to resolve the issue and prevent it 
from persisting in the user interface.
*/
export const EXTRA_TIME_TO_WAIT_FOR_END_POLL_EVENT = 2000; // ms

/**
 * STREAM MANAGER
 */
export const STREAM_ACTION_NAME = {
  QUIZ: 'quiz',
  CELEBRATION: 'celebration',
  NOTICE: 'notice',
  POLL: 'poll',
  PRODUCT: 'product',
  AMAZON_PRODUCT: 'amazon_product'
};

export const QUIZ_DATA_KEYS = {
  QUESTION: 'question',
  ANSWERS: 'answers',
  CORRECT_ANSWER_INDEX: 'correctAnswerIndex',
  DURATION: 'duration'
};

export const PRODUCT_DATA_KEYS = {
  TITLE: 'title',
  PRICE: 'price',
  IMAGE_URL: 'imageUrl',
  DESCRIPTION: 'description'
};

export const NOTICE_DATA_KEYS = {
  TITLE: 'title',
  MESSAGE: 'message',
  DURATION: 'duration'
};

export const AMAZON_PRODUCT_DATA_KEYS = {
  SELECTED_PRODUCT_INDEX: 'selectedProductIndex',
  SELECTED_SORT_CATEGORY: 'selectedSortCategory',
  KEYWORD: 'keyword',
  PRODUCT_CHOICE: 'productChoice',
  PRODUCT_OPTIONS: 'productOptions',
  PRODUCT_PAGE_NUMBER: 'productPageNumber'
};

export const POLL_DATA_KEYS = {
  QUESTION: 'question',
  ANSWERS: 'answers',
  DURATION: 'duration'
};

export const LOCALSTORAGE_ENABLED_STREAM_ACTIONS = [
  STREAM_ACTION_NAME.QUIZ,
  STREAM_ACTION_NAME.CELEBRATION,
  STREAM_ACTION_NAME.NOTICE,
  STREAM_ACTION_NAME.PRODUCT,
  STREAM_ACTION_NAME.POLL
];

/**
 * Amazon Product Sorting Categories
 */
const $sort_categories =
  $streamManagerContent.stream_manager_actions.amazon_product.dropdown
    .sort_categories;

export const DEFAULT_SELECTED_SORT_CATEGORY = 'Relevance';

export const SORT_CATEGORIES_TWO_COL = [
  {
    category: 'Relevance',
    label: $sort_categories.relevance
  },
  {
    category: 'NewestArrivals',
    label: $sort_categories.new_arrivals
  },
  {
    category: 'Price:LowToHigh',
    label: $sort_categories.price_low_to_high
  },
  {
    category: 'Featured',
    label: $sort_categories.featured
  },
  {
    category: 'Price:HighToLow',
    label: $sort_categories.price_high_to_low
  }
];

export const SORT_CATEGORIES_ONE_COL = [
  {
    category: 'Relevance',
    label: $sort_categories.relevance
  },

  {
    category: 'Price:LowToHigh',
    label: $sort_categories.price_low_to_high
  },
  {
    category: 'Price:HighToLow',
    label: $sort_categories.price_high_to_low
  },
  {
    category: 'NewestArrivals',
    label: $sort_categories.new_arrivals
  },
  {
    category: 'Featured',
    label: $sort_categories.featured
  }
];

export const MAX_PAGES_TO_SCROLL = 5;
export const INFINITE_SCROLL_OFFSET = 2;
export const MAX_ITEMS_BEFORE_CONTENT_OVERFLOW = 5;

export const FETCH_AMAZON_PRODUCTS_ORIGINS = {
  SORT: 'sort',
  INPUT: 'input'
};

export const DEFAULT_CELEBRATION_DURATION = 10; // seconds

export const STREAM_MANAGER_ACTION_LIMITS = {
  [STREAM_ACTION_NAME.QUIZ]: {
    [QUIZ_DATA_KEYS.ANSWERS]: {
      min: 3, // count
      max: 5, // count
      maxCharLength: 128 // TENTATIVE
    },
    [QUIZ_DATA_KEYS.QUESTION]: { maxCharLength: 256 }, // TENTATIVE
    [QUIZ_DATA_KEYS.DURATION]: { min: 5, max: 30 } // seconds
  },
  [STREAM_ACTION_NAME.PRODUCT]: {
    [PRODUCT_DATA_KEYS.TITLE]: { maxCharLength: 32 },
    [PRODUCT_DATA_KEYS.PRICE]: { maxCharLength: 10 },
    [PRODUCT_DATA_KEYS.IMAGE_URL]: { maxCharLength: 256 }, // TENTATIVE
    [PRODUCT_DATA_KEYS.DESCRIPTION]: { maxCharLength: 256 }
  },
  [STREAM_ACTION_NAME.NOTICE]: {
    [NOTICE_DATA_KEYS.TITLE]: { maxCharLength: 24 },
    [NOTICE_DATA_KEYS.MESSAGE]: { maxCharLength: 256 },
    [NOTICE_DATA_KEYS.DURATION]: { min: 5, max: 30 } // seconds
  },
  [STREAM_ACTION_NAME.CELEBRATION]: {},
  [STREAM_ACTION_NAME.AMAZON_PRODUCT]: {
    [AMAZON_PRODUCT_DATA_KEYS.KEYWORD]: { maxCharLength: 150 }
  },
  [STREAM_ACTION_NAME.POLL]: {
    [POLL_DATA_KEYS.ANSWERS]: {
      min: 2, // count
      max: 5, // count
      maxCharLength: 40
    },
    [POLL_DATA_KEYS.QUESTION]: { maxCharLength: 256 }, // TENTATIVE
    [POLL_DATA_KEYS.DURATION]: { min: 10, max: 120 } // seconds
  }
};

const ADVANCED_DEFAULT_CONFIG = {
  maxBitrate: 3500,
  maxFramerate: 30,
  maxResolution: { width: 1280, height: 720 }
};

const {
  BASIC_FULL_HD_LANDSCAPE,
  BASIC_FULL_HD_PORTRAIT,
  STANDARD_LANDSCAPE,
  STANDARD_PORTRAIT
} = window.IVSBroadcastClient;
export const BROADCAST_STREAM_CONFIG_PRESETS = {
  [CHANNEL_TYPE.BASIC]: {
    landscape: BASIC_FULL_HD_LANDSCAPE,
    portrait: BASIC_FULL_HD_PORTRAIT
  },
  [CHANNEL_TYPE.STANDARD]: {
    landscape: STANDARD_LANDSCAPE,
    portrait: STANDARD_PORTRAIT
  },
  [CHANNEL_TYPE.ADVANCED_SD]: {
    landscape: ADVANCED_DEFAULT_CONFIG,
    portrait: ADVANCED_DEFAULT_CONFIG
  },
  [CHANNEL_TYPE.ADVANCED_HD]: {
    landscape: ADVANCED_DEFAULT_CONFIG,
    portrait: ADVANCED_DEFAULT_CONFIG
  }
};

/**
 * CHANNEL DIRECTORY, FOLLOWING
 */
export const MAX_AVATAR_COUNT = 14;

/**
 * Stream Manager page, Following section
 */
export const STREAM_MANAGER_DEFAULT_TAB = 0;
