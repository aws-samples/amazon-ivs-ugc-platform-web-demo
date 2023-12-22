import { forwardRef, useRef, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import {
  CreateVideo,
  MicOn,
  MicOff,
  ScreenShare,
  ScreenShareOff,
  VideoCamera,
  VideoCameraOff,
  CallToAction
} from '../../../../assets/icons';
import { CAMERA_LAYER_NAME } from '../../../../contexts/Broadcast/useLayers';
import { clsm, noop } from '../../../../utils';
import { MICROPHONE_AUDIO_INPUT_NAME } from '../../../../contexts/Broadcast/useAudioMixer';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import FloatingNav from '../../../../components/FloatingNav';
import GoLiveContainer from './GoLiveContainer';
import GoLiveContainerCollapsed from './GoLiveContainerCollapsed';

const $webBroadcastContent = $content.stream_manager_web_broadcast;

const StreamManagerWebBroadcast = forwardRef(
  (
    {
      isBroadcastCardOpen,
      onCollapse,
      onExpand,
      setIsWebBroadcastAnimating,
      webBroadcastParentContainerRef
    },
    previewRef
  ) => {
    const {
      activeDevices,
      isBroadcasting,
      isCameraHidden,
      isMicrophoneMuted,
      isScreenSharing,
      toggleCamera,
      toggleMicrophone,
      toggleScreenShare
    } = useBroadcast();

    const webBroadcastContainerRef = useRef();
    const { isDesktopView, isTouchscreenDevice } = useResponsiveDevice();
    const { state } = useLocation();
    const [isWhiteBoardOpen, setIsWhiteBoardOpen] = useState(false);
    const isUserRedirectedFromSettingsPageRef = useRef(
      state?.isWebBroadcastContainerOpen || false
    );
    
    const isDefaultGoLiveButton =
      !isUserRedirectedFromSettingsPageRef.current &&
      !isBroadcastCardOpen &&
      !isBroadcasting &&
      isDesktopView;
    const {
      [CAMERA_LAYER_NAME]: activeCamera,
      [MICROPHONE_AUDIO_INPUT_NAME]: activeMicrophone
    } = activeDevices;

    const handleOnCollapse = () => {
      if (isUserRedirectedFromSettingsPageRef.current)
        isUserRedirectedFromSettingsPageRef.current = false;
      onCollapse();
    };

    const isGoLiveContainerOpen =
      isBroadcastCardOpen || isUserRedirectedFromSettingsPageRef.current;

    
    console.log('isGoLiveContainerOpen',isGoLiveContainerOpen)
    
    const toggleWhiteboard = () => {
      setIsWhiteBoardOpen(!isWhiteBoardOpen);
      console.log(
        !isWhiteBoardOpen ? 'Whiteboard Closed' : 'Whiteboard Opened'
      );
    };

    const webBroadcastControllerButtons = useMemo(
      () => [
        {
          onClick: toggleMicrophone,
          ariaLabel: isMicrophoneMuted
            ? 'Turn on microphone'
            : 'Turn off microphone',
          isDeviceControl: true,
          isActive: !isMicrophoneMuted,
          isDisabled: !activeMicrophone,
          icon: isMicrophoneMuted ? <MicOff /> : <MicOn />,
          tooltip: isMicrophoneMuted
            ? $webBroadcastContent.unmute
            : $webBroadcastContent.mute
        },

        {
          onClick: toggleCamera,
          ariaLabel: isCameraHidden ? 'Turn on camera' : 'Turn off camera',
          isDeviceControl: true,
          isActive: !isCameraHidden,
          isDisabled: !activeCamera,
          icon: isCameraHidden ? <VideoCameraOff /> : <VideoCamera />,
          tooltip: isCameraHidden
            ? $webBroadcastContent.show_camera
            : $webBroadcastContent.hide_camera
        },

        {
          onClick: toggleScreenShare,
          ariaLabel: isScreenSharing
            ? 'Start screen sharing'
            : 'Stop screen sharing',
          isVisible: !isTouchscreenDevice,
          isActive: isScreenSharing,
          icon: isScreenSharing ? <ScreenShareOff /> : <ScreenShare />,
          tooltip: isScreenSharing
            ? $webBroadcastContent.stop_sharing
            : $webBroadcastContent.share_your_screen
        }
      ],
      [
        activeCamera,
        activeMicrophone,
        isCameraHidden,
        isMicrophoneMuted,
        isScreenSharing,
        isTouchscreenDevice,
        toggleCamera,
        toggleMicrophone,
        toggleScreenShare
      ]
    );

    return (
      <section
        ref={webBroadcastContainerRef}
        className={clsm([
          'w-full',
          'h-fit',
          'grid',
          'bg-lightMode-gray-extraLight',
          'dark:bg-darkMode-gray-dark',
          'lg:max-w-full',
          'max-w-[351px]',
          'p-5',
          'rounded-3xl',
          'mb-6'
        ])}
      >
        <GoLiveContainer
          ref={previewRef}
          isBroadcastCardOpen={isBroadcastCardOpen}
          webBroadcastParentContainerRef={webBroadcastParentContainerRef}
          webBroadcastContainerRef={webBroadcastContainerRef}
          webBroadcastControllerButtons={[
            ...webBroadcastControllerButtons,
            {
              onClick: toggleScreenShare,
              ariaLabel: isWhiteBoardOpen
                ? 'Turn on microphone'
                : 'Turn off microphone',
              isDeviceControl: true,
              isActive: !isWhiteBoardOpen,
              isDisabled: !activeMicrophone,
              icon: isWhiteBoardOpen ? <CallToAction /> : <CallToAction />,
              tooltip: isWhiteBoardOpen
                ? $webBroadcastContent.hide_whiteboard
                : $webBroadcastContent.show_whiteboard
            }
          ]}
          isOpen={isGoLiveContainerOpen}
          onCollapse={handleOnCollapse}
          setIsWebBroadcastAnimating={setIsWebBroadcastAnimating}
        />
        {!isBroadcastCardOpen && isBroadcasting && isDesktopView && (
          <GoLiveContainerCollapsed
            isOpen={isGoLiveContainerOpen}
            webBroadcastControllerButtons={[
              ...webBroadcastControllerButtons,
              {
                onClick: toggleWhiteboard,
                ariaLabel: isWhiteBoardOpen
                  ? 'Turn on microphone'
                  : 'Turn off microphone',
                isDeviceControl: true,
                isActive: !isWhiteBoardOpen,
                isDisabled: !activeMicrophone,
                icon: isWhiteBoardOpen ? <CallToAction /> : <CallToAction />,
                tooltip: isWhiteBoardOpen
                  ? $webBroadcastContent.hide_whiteboard
                  : $webBroadcastContent.show_whiteboard
              }
            ]}
            onExpand={onExpand}
          />
        )}
        {isDefaultGoLiveButton && (
          <Button
            onClick={onExpand}
            variant="primary"
            className={clsm([
              'h-14',
              'dark:[&>svg]:fill-black',
              'relative',
              '[&>svg]:h-6',
              '[&>svg]:w-6',
              'space-x-1',
              'rounded-xl'
            ])}
            data-testid="web-broadcast-go-live-button"
          >
            <CreateVideo />
            <p>{$webBroadcastContent.go_live}</p>
          </Button>
        )}
        <FloatingNav />
      </section>
    );
  }
);

StreamManagerWebBroadcast.propTypes = {
  isBroadcastCardOpen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  setIsWebBroadcastAnimating: PropTypes.func,
  webBroadcastParentContainerRef: PropTypes.object.isRequired
};

StreamManagerWebBroadcast.defaultProps = {
  setIsWebBroadcastAnimating: noop
};

export default StreamManagerWebBroadcast;
