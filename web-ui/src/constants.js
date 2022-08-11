export const USE_MOCKS = false;
export const DASHBOARD_THEME_COLOR = '#292b32';
export const USER_MANAGEMENT_THEME_COLOR = '#000000';
export const STREAM_SESSIONS_REFRESH_INTERVAL = 15000; // 15 seconds
export const STREAM_SESSION_DATA_REFRESH_INTERVAL = 5000; // 5 seconds
export const CHANNEL_DATA_REFRESH_INTERVAL = 5000; // 5 seconds
export const CHANNEL_TYPE = { BASIC: 'BASIC', STANDARD: 'STANDARD' };

export const USERNAME_EXISTS_EXCEPTION = 'UsernameExistsException';
export const RESERVED_USERNAME_EXCEPTION = 'ReservedUsernameException';
export const EMAIL_EXISTS_EXCEPTION = 'EmailExistsException';
export const USER_NOT_FOUND_EXCEPTION = 'UserNotFoundException';
export const NOT_AUTHORIZED_EXCEPTION = 'NotAuthorizedException';
export const LIMIT_EXCEEDED_EXCEPTION = 'LimitExceededException';
export const ALIAS_EXISTS_EXCEPTION = 'AliasExistsException';
export const UNEXPECTED_EXCEPTION = 'UnexpectedException';
export const USER_LAMBDA_VALIDATION_EXCEPTION = 'UserLambdaValidationException';

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

export const GENERIC_ERROR_MESSAGE = 'Unexpected Error Occurred';

export const CONCURRENT_VIEWS = 'ConcurrentViews';
export const INGEST_FRAMERATE = 'IngestFramerate';
export const INGEST_VIDEO_BITRATE = 'IngestVideoBitrate';
export const KEYFRAME_INTERVAL = 'KeyframeInterval';

export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 990
};

export const NO_DATA_VALUE = '----';

export const PROFILE_COLORS = [
  'green',
  'yellow',
  'blue',
  'orange',
  'purple',
  'aqua',
  'violet'
];
