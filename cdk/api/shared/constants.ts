export const ACCOUNT_DELETION_EXCEPTION = 'AccountDeletionException';
export const ACCOUNT_REGISTRATION_EXCEPTION = 'AccountRegistrationException';
export const BAN_USER_EXCEPTION = 'BanUserException';
export const CHANGE_USER_PREFERENCES_EXCEPTION =
  'ChangeUserPreferencesException';
export const CHANGE_USERNAME_EXCEPTION = 'ChangeUsernameException';
export const CHANNEL_NOT_BROADCASTING_EXCEPTION =
  'ChannelNotBroadcastingException';
export const CHATROOM_ARN_NOT_FOUND_EXCEPTION = 'ChatRoomArnNotFoundException';
export const EMAIL_EXISTS_EXCEPTION = 'EmailExistsException';
export const FORBIDDEN_EXCEPTION = 'ForbiddenException';
export const FORGOT_PASSWORD_EXCEPTION = 'ForgotPasswordException';
export const RESERVED_USERNAME_EXCEPTION = 'ReservedUsernameException';
export const RESET_STREAM_KEY_EXCEPTION = 'ResetStreamKeyException';
export const TIMED_METADATA_EXCEPTION = 'TimedMetadataException';
export const TIMED_METADATA_VALIDATION_EXCEPTION =
  'TimedMetadataValidationException';
export const UNAUTHORIZED_EXCEPTION = 'UnauthorizedException';
export const UNBAN_USER_EXCEPTION = 'UnbanUserException';
export const UNEXPECTED_EXCEPTION = 'UnexpectedException';
export const USER_NOT_FOUND_EXCEPTION = 'UserNotFoundException';

export const INGEST_FRAMERATE = 'IngestFramerate';
export const INGEST_VIDEO_BITRATE = 'IngestVideoBitrate';
const KEYFRAME_INTERVAL = 'KeyframeInterval';
const CONCURRENT_VIEWS = 'ConcurrentViews';
export const STREAM_HEALTH_METRICS_NAMES = [
  INGEST_FRAMERATE,
  INGEST_VIDEO_BITRATE,
  KEYFRAME_INTERVAL,
  CONCURRENT_VIEWS
];

export const SEC_PER_HOUR = 3600;
export const SEC_PER_DAY = SEC_PER_HOUR * 24;
export const MAX_USERNAME_CHARACTER_COUNT = 20;
export const MIN_USERNAME_CHARACTER_COUNT = 4;

export const RESTRICTED_USERNAMES = [
  'health',
  'manager',
  'feed',
  'following',
  'settings',
  'login',
  'register',
  'reset'
];
