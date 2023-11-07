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
export const BAD_REQUEST_EXCEPTION = 'BadRequestException';
export const INVALID_PRESIGNED_POST_INPUT_EXCEPTION =
  'InvalidPresignedPostInputException';
export const DELETE_CHANNEL_ASSET_EXCEPTION = 'DeleteChannelAssetException';
export const FOLLOWING_LIST_DUPLICATE_EXCEPTION =
  'FollowingListDuplicateException';
export const SORT_PRODUCTS_EXCEPTION = 'SortProductsException';
export const TOO_MANY_REQUESTS_EXCEPTION = 'TooManyRequestsException';
export const STAGE_DELETION_EXCEPTION = 'StageDeletionException';

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

export const TIMED_METADATA_MAXIMUM_REQUEST_RETRIES = 3;
export const TIMED_METADATA_CONSTANT_BACKOFF_RETRY_DELAY = 1000; // ms

/**
 * When adding a new asset type, be sure to add it to the following places:
 * - MAXIMUM_IMAGE_FILE_SIZE
 * - ALLOWED_CHANNEL_ASSET_TYPES
 * - [cdk/lib/constants.ts](../../lib/constants.ts) -> ALLOWED_CHANNEL_ASSET_TYPES
 */
export const MAXIMUM_IMAGE_FILE_SIZE = { avatar: 1, banner: 5 }; // Sizes are in MB
export const ALLOWED_CHANNEL_ASSET_TYPES = ['avatar', 'banner'] as const;
export const ALLOWED_IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png'
] as const;
export const CUSTOM_AVATAR_NAME = 'custom' as const;

/**
 * IDs to be consumed by the AWS Secrets Manager
 * GetSecretValueCommand(<SECRET_ID>)
 */
export const SECRET_IDS = {
  PA_API: 'Product_Advertising_API_Secret_Keys',
  APPSYNC_GRAPHQL_API: 'AppSync_GraphQL_API_Secret_Keys'
};

export const MAX_SERVER_PARAM_LENGTH = 200;
export const DEFAULT_FASTIFY_MAX_PARAM_LENGTH = 100;

export const FETCH_AMAZON_PRODUCTS_ORIGINS = {
  SORT: 'sort',
  INPUT: 'input'
};

/**
 * Stages
 */
export const STAGE_TOKEN_DURATION = 1440; // Minutes

export const CHANNELS_TABLE_STAGE_FIELDS = {
  STAGE_ID: 'stageId',
  STAGE_CREATION_DATE: 'stageCreationDate'
};

export const APPSYNC_EVENT_TYPES = {
  STAGE_REVOKE_REQUEST_TO_JOIN: 'STAGE_REVOKE_REQUEST_TO_JOIN'
}
