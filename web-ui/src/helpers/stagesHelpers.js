import { streamManager as $streamManagerContent } from '../content';
import { isiOS } from '../utils';

const userJoinedNotificationContent =
  $streamManagerContent.stream_manager_stage.notifications.success
    .user_has_joined_the_session;
const REPLACEMENT_TEXT = 'USERNAME';

export const JOIN_PARTICIPANT_URL_PARAM_KEY = 'session';

export const createJoinParticipantLink = (stageId) => {
  const url = new URL(window.location.href);
  if (!url.searchParams.get(JOIN_PARTICIPANT_URL_PARAM_KEY)) {
    url.searchParams.append(JOIN_PARTICIPANT_URL_PARAM_KEY, stageId);
  }

  return url.href;
};

export const createUserJoinedSuccessMessage = (username) => {
  const successMessageWithUsername = userJoinedNotificationContent.replace(
    REPLACEMENT_TEXT,
    username
  );

  return successMessageWithUsername;
};

export const getVideoConstraints = (cameraDeviceId) => ({
  deviceId: cameraDeviceId,
  ...(!isiOS && {
    width: {
      ideal: 1280,
      max: 1280
    },
    height: {
      ideal: 720,
      max: 720
    },
    aspectRatio: { ideal: 16 / 9 },
    resizeMode: 'none'
  })
});
