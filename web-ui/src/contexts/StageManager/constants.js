const { LogLevels } = window.IVSBroadcastClient;

export const PARTICIPANT_GROUP = {
  USER: 'user',
  DISPLAY: 'display'
};

export const CUSTOM_STAGE_EVENTS = {
  STAGE_PARTICIPANT_SHOULD_UNPUBLISH: 'stageParticipantShouldUnpublish',
  STAGE_PARTICIPANT_REPUBLISH_STATE_CHANGED:
    'stageParticipantRepublishStateChanged'
};

export const APP_ENV = {
  DEV: 'development',
  PROD: 'production',
  STAGING: 'staging',
  TEST: 'test'
};

/**
 * Stages
 */
export const STAGE_PUBLISHING_CAPACITY = 12;

// Simulcast configurations do not apply to screen-shares
export const DEFAULT_SIMULCAST_CONFIG = { enabled: true };

export const STORAGE_VERSION = '2';

export const LOG_LEVELS = {
  [APP_ENV.DEV]: LogLevels.INFO,
  [APP_ENV.STAGING]: LogLevels.ERROR
};
