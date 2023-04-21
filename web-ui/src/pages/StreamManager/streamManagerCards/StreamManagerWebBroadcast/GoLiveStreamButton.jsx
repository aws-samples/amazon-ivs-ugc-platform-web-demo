import { useRef } from 'react';

import { clsm } from '../../../../utils';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useModal } from '../../../../contexts/Modal';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import Spinner from '../../../../components/Spinner';
import Tooltip from '../../../../components/Tooltip';
import PropTypes from 'prop-types';

import { CAMERA_LAYER_NAME } from '../../../../contexts/Broadcast/useLayers';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../../../contexts/Broadcast/useAudioMixer';

const $webBroadcastContent = $content.stream_manager_web_broadcast;
const {
  your_channel_is_already_live: YourChannelIsAlreadyLive,
  notifications: {
    error: { permissions_denied: PermissionDenied }
  }
} = $webBroadcastContent;

const GoLiveStreamButton = ({ tooltipPosition }) => {
  const streamButtonRef = useRef();
  const {
    isBroadcasting,
    startBroadcast,
    stopBroadcast,
    isConnecting,
    activeDevices
  } = useBroadcast();
  const {
    [CAMERA_LAYER_NAME]: activeCamera,
    [MICROPHONE_AUDIO_INPUT_NAME]: activeMicrophone
  } = activeDevices;
  const { openModal } = useModal();
  const { isLive } = useStreams();
  const isDisabled =
    (isLive && !isBroadcasting) || !activeCamera || !activeMicrophone;

  const handleStartStopBroadcastingAction = () => {
    if (isBroadcasting) {
      openModal({
        content: {
          confirmText: $webBroadcastContent.end_stream,
          message: $webBroadcastContent.confirm_end_stream,
          isDestructive: true
        },
        onConfirm: stopBroadcast,
        lastFocusedElement: streamButtonRef
      });
    } else startBroadcast();
  };

  let tooltipMessage;
  if (isLive && !isBroadcasting) tooltipMessage = YourChannelIsAlreadyLive;
  else if (activeCamera === false || activeMicrophone === false)
    tooltipMessage = PermissionDenied;

  let buttonTextContent;
  if (isConnecting) {
    buttonTextContent = <Spinner />;
  } else if (isBroadcasting) {
    buttonTextContent = <p>{$webBroadcastContent.end_stream}</p>;
  } else {
    buttonTextContent = <p>{$webBroadcastContent.start_stream}</p>;
  }

  return (
    <Tooltip
      position={tooltipPosition}
      translate={{ y: -2 }}
      message={tooltipMessage}
    >
      <Button
        ref={streamButtonRef}
        onClick={handleStartStopBroadcastingAction}
        variant="primary"
        isDisabled={isDisabled}
        className={clsm([
          'w-full',
          'h-11',
          'dark:[&>svg]:fill-black',
          'relative',
          '[&>svg]:h-6',
          '[&>svg]:w-6',
          'space-x-1',
          'rounded-3xl',
          isBroadcasting && [
            'dark:bg-darkMode-red',
            'bg-darkMode-red',
            'hover:dark:bg-darkMode-red-hover',
            'hover:bg-darkMode-red-hover',
            'focus:dark:bg-darkMode-red-hover',
            'focus:bg-darkMode-red-hover'
          ]
        ])}
      >
        {buttonTextContent}
      </Button>
    </Tooltip>
  );
};

GoLiveStreamButton.propTypes = {
  tooltipPosition: PropTypes.oneOf(['above', 'below', 'right', 'left'])
    .isRequired
};

export default GoLiveStreamButton;
