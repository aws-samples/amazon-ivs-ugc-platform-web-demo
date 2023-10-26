import { useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useModal } from '../../../../contexts/Modal';
import { useChannel } from '../../../../contexts/Channel';
import { useStreams } from '../../../../contexts/Streams';
import Button from '../../../../components/Button';
import Spinner from '../../../../components/Spinner';
import Tooltip from '../../../../components/Tooltip';

const $webBroadcastContent = $content.stream_manager_web_broadcast;
const {
  your_channel_is_already_live: YourChannelIsAlreadyLive,
  notifications: {
    error: { permissions_denied: PermissionDenied }
  }
} = $webBroadcastContent;

const GoLiveStreamButton = ({
  tooltipPosition,
  tooltipCustomTranslate,
  shouldShowTooltipMessage
}) => {
  const streamButtonRef = useRef();
  const {
    isBroadcasting,
    startBroadcast,
    stopBroadcast,
    isConnecting,
    hasPermissions
  } = useBroadcast();
  const { openModal } = useModal();
  const { isLive } = useStreams();
  const { channelData: { stageId = null } = {} } = useChannel();
  const isStreaming = (isLive && !isBroadcasting) || !!stageId;
  const isDisabled = isStreaming || !hasPermissions;
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
  if (shouldShowTooltipMessage) {
    if (isStreaming) tooltipMessage = YourChannelIsAlreadyLive;
    else if (!hasPermissions) tooltipMessage = PermissionDenied;
  }

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
      translate={tooltipCustomTranslate}
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
            'bg-lightMode-red',
            'hover:dark:bg-darkMode-red-hover',
            'hover:bg-lightMode-red-hover',
            'focus:bg-lightMode-red',
            'dark:focus:bg-darkMode-red'
          ]
        ])}
      >
        {buttonTextContent}
      </Button>
    </Tooltip>
  );
};

GoLiveStreamButton.defaultProps = {
  tooltipCustomTranslate: {},
  shouldShowTooltipMessage: true
};

GoLiveStreamButton.propTypes = {
  tooltipPosition: PropTypes.oneOf(['above', 'below', 'right', 'left'])
    .isRequired,
  tooltipCustomTranslate: PropTypes.object,
  shouldShowTooltipMessage: PropTypes.bool
};

export default GoLiveStreamButton;
