export const EMAIL_EXISTS_EXCEPTION = 'EmailExistsException';
export const UNEXPECTED_EXCEPTION = 'UnexpectedException';
export const USER_NOT_FOUND_EXCEPTION = 'UserNotFoundException';

export const ACCOUNT_REGISTRATION_EXCEPTION = 'AccountRegistrationException';
export const FORGOT_PASSWORD_EXCEPTION = 'ForgotPasswordException';
export const ACCOUNT_DELETION_EXCEPTION = 'AccountDeletionException';
export const RESET_STREAM_KEY_EXCEPTION = 'ResetStreamKeyException';
export const CHANGE_USERNAME_EXCEPTION = 'ChangeUsernameException';

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
