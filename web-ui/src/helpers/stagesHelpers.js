import { streamManager as $streamManagerContent } from '../content';
import { isiOS } from '../utils';
import { STREAM_ACTION_NAME } from '../constants';

const userJoinedNotificationContent =
  $streamManagerContent.stream_manager_stage.notifications.success
    .user_has_joined_the_session;
const userScreenshareNameContent =
  $streamManagerContent.stream_manager_stage.screenshare;
const REPLACEMENT_TEXT = 'USERNAME';

export const USER_STAGE_ID_URL_PARAM = 'user';
export const DISPLAY_STAGE_ID_URL_PARAM = 'display';
export const REQUEST_URL_PARAM_KEY = 'Request';

export const createJoinParticipantLink = (stageId) => {
  const url = new URL(window.location.href);
  if (!url.searchParams.get(USER_STAGE_ID_URL_PARAM)) {
    url.searchParams.append(USER_STAGE_ID_URL_PARAM, stageId);
  }

  return url.href;
};

export const createUserJoinedSuccessMessage = (
  username,
  participantGroup = 'user'
) => {
  let successMessageWithUsername;
  if (participantGroup === 'user') {
    successMessageWithUsername = userJoinedNotificationContent.replace(
      REPLACEMENT_TEXT,
      username
    );
  }
  if (participantGroup === 'display') {
    successMessageWithUsername = userJoinedNotificationContent.replace(
      REPLACEMENT_TEXT,
      `${username}${userScreenshareNameContent}`
    );
  }

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

export const getLeavePromptText = ({
  isMobile,
  isPollActive,
  isStageActive,
  isBroadcasting
}) => {
  let confirmText, message;

  if (isBroadcasting) {
    message = (
      <p>
        {
          $streamManagerContent.stream_manager_web_broadcast
            .confirm_leave_page_L1
        }
        {isMobile ? ' ' : <br />}
        {
          $streamManagerContent.stream_manager_web_broadcast
            .confirm_leave_page_L2
        }
      </p>
    );
    confirmText = $streamManagerContent.stream_manager_web_broadcast.leave_page;
  }

  if (isStageActive) {
    message = (
      <p>
        {
          $streamManagerContent.stream_manager_stage.leave_stage_modal
            .confirm_leave_page_L1
        }
        {isMobile ? ' ' : <br />}
        {
          $streamManagerContent.stream_manager_stage.leave_stage_modal
            .confirm_leave_page_L2
        }
      </p>
    );
    confirmText =
      $streamManagerContent.stream_manager_stage.leave_stage_modal.leave_page;
  }

  if (isPollActive) {
    message = (
      <p>
        {
          $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL]
            .confirm_leave_page
        }
      </p>
    );
    confirmText =
      $streamManagerContent.stream_manager_actions[STREAM_ACTION_NAME.POLL]
        .leave_page;
  }

  return {
    confirmText,
    message
  };
};
