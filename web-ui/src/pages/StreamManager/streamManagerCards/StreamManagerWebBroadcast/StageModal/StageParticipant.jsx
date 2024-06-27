import PropTypes from 'prop-types';

import Button from '../../../../../components/Button';
import {
  Close,
  MicOff,
  MicOn,
  ScreenShare,
  VideoCamera,
  VideoCameraOff
} from '../../../../../assets/icons';
import StageProfilePill, {
  STAGE_PROFILE_TYPES
} from '../StageVideoFeeds/StageProfilePill';
import { clsm } from '../../../../../utils';
import { getAvatarSrc } from '../../../../../helpers';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import * as stagesAPI from '../../../../../api/stages';
import { useAppSync } from '../../../../../contexts/AppSync';
import channelEvents from '../../../../../contexts/AppSync/channelEvents';
import { MODAL_TYPE, useModal } from '../../../../../contexts/Modal';
import { streamManager as $content } from '../../../../../content';
import Tooltip from '../../../../../components/Tooltip';
import { useGlobalStage } from '../../../../../contexts/Stage';
import { PARTICIPANT_TYPES } from '../../../../../contexts/Stage/Global/reducer/globalReducer';

const $stageContent = $content.stream_manager_stage;

const StageParticipant = ({ participant }) => {
  const { isTouchscreenDevice, currentBreakpoint } = useResponsiveDevice();
  const {
    videoStopped: isCameraHidden,
    audioMuted: isMicrophoneMuted,
    attributes,
    id
  } = participant;
  const { username, profileColor, channelId, type } = attributes;
  const avatarSrc = getAvatarSrc(attributes);
  const { publish } = useAppSync();
  const { closeModal, openModal } = useModal();
  const { updateError } = useGlobalStage();
  const isHost = type === PARTICIPANT_TYPES.HOST;
  const REPLACEMENT_TEXT = 'USERNAME';
  const message = $stageContent.remove_participant_confirmation_text.replace(
    REPLACEMENT_TEXT,
    username
  );
  const removeScreenshareMessage =
    $stageContent.participants_modal.remove_screen_share.replace(
      REPLACEMENT_TEXT,
      username
    );
  const isScreenshare = type === PARTICIPANT_TYPES.SCREENSHARE;

  const handleDisconnectParticipant = () => {
    closeModal();
    openModal({
      content: {
        confirmText: $stageContent.remove_participant,
        isDestructive: true,
        message
      },
      onConfirm: async () => {
        const { result, error } = await stagesAPI.disconnectParticipant(id);

        if (error) {
          updateError({
            message:
              $stageContent.notifications.error.failed_to_remove_participant,
            err: error
          });
        } else {
          if (result?.message) {
            publish(
              channelId.toLowerCase(),
              JSON.stringify({ type: channelEvents.STAGE_PARTICIPANT_KICKED })
            );
          }
        }
      },
      onCancel: () => {
        openModal({
          type: MODAL_TYPE.STAGE_PARTICIPANTS
        });
      }
    });
  };

  const handleDisconnectParticipantScreenshare = () => {
    closeModal();
    openModal({
      content: {
        confirmText: $stageContent.remove_participant,
        isDestructive: true,
        message: removeScreenshareMessage
      },
      onConfirm: () => {
        publish(
          channelId.toLowerCase(),
          JSON.stringify({
            type: channelEvents.HOST_REMOVES_PARTICIPANT_SCREEN_SHARE
          })
        );
      },
      onCancel: () => {
        openModal({
          type: MODAL_TYPE.STAGE_PARTICIPANTS
        });
      }
    });
  };

  const participantStreamingStatusIcon =
    type === PARTICIPANT_TYPES.SCREENSHARE ? (
      <ScreenShare />
    ) : (
      <>
        {isCameraHidden ? (
          <VideoCameraOff className="!fill-darkMode-gray" />
        ) : (
          <VideoCamera />
        )}
        {isMicrophoneMuted ? (
          <MicOff className="!fill-darkMode-gray" />
        ) : (
          <MicOn />
        )}
      </>
    );

  return (
    <div
      className={clsm([
        'flex',
        'h-11',
        'items-center',
        'my-8',
        'justify-between',
        'gap-4'
      ])}
    >
      <StageProfilePill
        avatarSrc={avatarSrc}
        profileColor={profileColor}
        username={username}
        type={STAGE_PROFILE_TYPES.PARTICIPANTS_MODAL}
        className={clsm([
          '[&>img]:w-11',
          '[&>img]:h-11',
          'gap-4',
          'max-w-none',
          'min-w-[96px]',
          'w-full'
        ])}
        textClassName="text-[15px]"
        isScreenshare={isScreenshare}
        isHost={isHost}
      />
      <div
        className={clsm([
          'flex',
          'justify-between',
          'w-full',
          'sm:w-auto',
          'max-w-[200px]',
          'min-w-[136px]',
          'items-center',
          isHost && currentBreakpoint && '-ml-7'
        ])}
      >
        <div
          className={clsm([
            'bg-lightMode-gray-light',
            'dark:bg-darkMode-gray-dark',
            'flex',
            'gap-3',
            'p-2',
            'px-3',
            'dark:[&>svg]:fill-white',
            '[&>svg]:fill-black',
            '[&>svg]:w-5',
            '[&>svg]:h-5',
            'rounded-[20px]'
          ])}
        >
          {participantStreamingStatusIcon}
        </div>

        {type !== PARTICIPANT_TYPES.HOST && (
          <div className={clsm(['min-w-[44px]', 'min-h-[44px]'])}>
            <Tooltip
              key="remove-participant-control-tooltip"
              position="below"
              translate={{ y: -2 }}
              message={$stageContent.participants_modal.remove_participant}
            >
              <Button
                ariaLabel="Reject participants"
                className={clsm([
                  'w-11',
                  'h-11',
                  'dark:[&>svg]:fill-white',
                  '[&>svg]:fill-black',
                  'dark:bg-darkMode-gray',
                  !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                  'dark:focus:bg-darkMode-gray',
                  'bg-lightMode-gray'
                ])}
                onClick={
                  isScreenshare
                    ? handleDisconnectParticipantScreenshare
                    : handleDisconnectParticipant
                }
                variant="icon"
              >
                <Close />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
};

StageParticipant.propTypes = {
  participant: PropTypes.shape({
    id: PropTypes.string,
    attributes: PropTypes.shape({
      username: PropTypes.string,
      channelId: PropTypes.string,
      profileColor: PropTypes.string,
      type: PropTypes.string
    }),
    userId: PropTypes.string,
    videoStopped: PropTypes.bool,
    audioMuted: PropTypes.bool,
    mediaStream: PropTypes.instanceOf(MediaStream)
  }).isRequired
};

export default StageParticipant;
