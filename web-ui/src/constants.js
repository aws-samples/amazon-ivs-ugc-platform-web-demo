/**
 * MISC
 */
export const NO_DATA_VALUE = '----';

export const CHANNEL_TYPE = { BASIC: 'BASIC', STANDARD: 'STANDARD' };

/**
 * APP
 */
export const BREAKPOINTS = { xxs: 0, xs: 331, sm: 576, md: 768, lg: 990 };

export const MAIN_THEME_COLOR = '#292b32';

export const DEFAULT_NOTIF_TIMEOUT = 3000; // ms

export const CHANNEL_DATA_REFRESH_INTERVAL = 5000; // 5 seconds

/**
 * DEBUG
 */
export const USE_MOCKS = false;

export const ENABLE_CHAT_DEBUG_MESSAGES = false;

export const RESTRICTED_PROD_CONSOLE_TYPES = ['log', 'info'];

/**
 * EXCEPTIONS
 */
export const ALIAS_EXISTS_EXCEPTION = 'AliasExistsException';
export const EMAIL_EXISTS_EXCEPTION = 'EmailExistsException';
export const LIMIT_EXCEEDED_EXCEPTION = 'LimitExceededException';
export const NOT_AUTHORIZED_EXCEPTION = 'NotAuthorizedException';
export const RESERVED_USERNAME_EXCEPTION = 'ReservedUsernameException';
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
 * Channels
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

export const FLOATING_PLAYER_PAGES = [
  'stream_manager',
  'stream_health',
  'settings'
];

/**
 * CHAT
 */
export const CHAT_TOKEN_REFRESH_DELAY_OFFSET = 30000; // The time in ms before the chat session expires that the token should be refreshed

export const MODERATOR_PILL_TIMEOUT = 5000; // ms

export const COMPOSER_MAX_CHARACTER_LENGTH = 500;
export const COMPOSER_RATE_LIMIT_BLOCK_TIME_MS = 2000; // 2 seconds

/**
 * STREAM ACTIONS
 */
export const STREAM_ACTION_NAME = {
  QUIZ: 'quiz',
  PRODUCT: 'product',
  NOTICE: 'notice',
  CELEBRATION: 'celebration'
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
  [STREAM_ACTION_NAME.CELEBRATION]: {}
};
