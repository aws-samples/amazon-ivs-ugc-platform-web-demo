import {
  forwardRef,
  useRef,
  useMemo,
  useState,
  useContext,
  useEffect
} from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';

import {
  CreateVideo,
  MicOn,
  MicOff,
  ScreenShare,
  ScreenShareOff,
  VideoCamera,
  VideoCameraOff,
  CallToAction,
  DownArrow
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
import { useUser } from '../../../../contexts/User';
import IVSBroadcastClient from 'amazon-ivs-web-broadcast';
// import { Stage, SubscribeType, LocalStageStream } from 'amazon-ivs-web-broadcast'
import { StageContext } from '../../contexts/StageContext';
import { useChat } from '../../../../contexts/Chat';
import StageParticipants from '../../components/StageParticipants';
import { BroadcastContext } from '../../contexts/BroadcastContext';

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
      toggleScreenShare,
      toggleWhiteBoard,
      downloadCanvasPDF
    } = useBroadcast();
    const {
      joinStage,
      stageJoined,
      leaveStage,
      screenshareStageJoined,
      publishScreenshare,
      unpublishScreenshare,
      handleSetStageInfo
    } = useContext(StageContext);

    const {
      isModerator,
      joinRequestStatus,
      stageData,
      setStageData,
      isStageOwner,
      setIsStageOwner
    } = useChat();

    const {
      init,
      startBroadcast,
      stopBroadcast,
      broadcastStarted,
      updateStreamKey
    } = useContext(BroadcastContext);
    // console.log("stageData", stageData);

    const webBroadcastContainerRef = useRef();
    const { isDesktopView, isTouchscreenDevice } = useResponsiveDevice();
    const { state } = useLocation();


    const [searchParams, setSearchParams] = useSearchParams();
    const param = searchParams.get('data')
    let joiningStage =0;

    const [isWhiteBoardOpen] = useState(false);
    const isUserRedirectedFromSettingsPageRef = useRef(
      state?.isWebBroadcastContainerOpen || false
    );
    const joinAsParticipant = state?.joinAsParticipant;
    const groupId = state?.groupId;
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

    const { userData } = useUser();
    // const userId = userData?.id
    const onStartStage = async () => {
      const response = await fetch(
        'https://pqyf6f3sk0.execute-api.us-east-1.amazonaws.com/prod/create',
        {
          body: JSON.stringify({
            groupIdParam: `${userData?.username}`,
            userId: userData?.username,
            attributes: {
              avatarUrl: '',
              username: userData?.username
            },
            channelData: {
              ingestEndpoint: userData?.ingestEndpoint,
              playbackUrl: userData?.ingestEndpoint,
              streamKey: userData?.streamKeyValue,
              channelId: userData?.channelArn,
              roomId: userData?.chatRoomArn
            }
          }),
          method: 'POST'
        }
      );
      const createStageResponse = await response.json();
      const joinRes = await fetch(
        'https://pqyf6f3sk0.execute-api.us-east-1.amazonaws.com/prod/join',
        {
          body: JSON.stringify({
            groupId: createStageResponse?.groupId,
            userId: userData?.username,
            attributes: {
              avatarUrl: '',
              username: userData?.username
            }
          }),
          method: 'POST'
        }
      );
      const joinData = await joinRes.json();
      console.log('Token',joinData?.stage?.token?.token)
      handleSetStageInfo({ ...createStageResponse, ...joinData });
      setStageData(createStageResponse);
      joinStage(joinData?.stage?.token?.token);
      init(userData?.ingestEndpoint)
      updateStreamKey(userData?.streamKeyValue)
      onExpand();

      // const stage = new Stage(joinData?.stage?.token?.token, strategy);
      // await stage.join();

      // To update later (e.g. in an onClick event handler)
      // strategy.updateTracks(myNewAudioTrack, myNewVideoTrack);
      //stage.refreshStrategy();
      // console.log("response",await response.json(), response);
    };

    const joinStageFn = async (
      groupId
    ) => {
      if(joiningStage > 0) return
      joiningStage = 1
      const joinRes = await fetch(
        'https://pqyf6f3sk0.execute-api.us-east-1.amazonaws.com/prod/join',
        {
          body: JSON.stringify({
            groupId: groupId,
            userId: userData?.username,
            attributes: {
              avatarUrl: '',
              username: userData?.username
            }
          }),
          method: 'POST'
        }
      );
      const joinData = await joinRes.json();
      console.log('Token',joinData?.stage?.token?.token)
      handleSetStageInfo({ ...joinData });
      init(userData?.ingestEndpoint)
      updateStreamKey(userData?.streamKeyValue)
      joinStage(joinData?.stage?.token?.token);
      // setJoiningStage(false)
      // onExpand();
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

    useEffect(() => {
      if (joinAsParticipant && joiningStage === 0) {
        joinStageFn(groupId);
      }
    }, [joinAsParticipant]);
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
        <StageParticipants />
        <GoLiveContainer
          ref={previewRef}
          isBroadcastCardOpen={isBroadcastCardOpen}
          webBroadcastParentContainerRef={webBroadcastParentContainerRef}
          webBroadcastContainerRef={webBroadcastContainerRef}
          webBroadcastControllerButtons={[
            ...webBroadcastControllerButtons,
            {
              onClick: toggleWhiteBoard,
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
            },
            {
              onClick: downloadCanvasPDF,
              ariaLabel: 'Download pdf',
              isActive: true,
              isDeviceControl: true,
              isVisible: !isWhiteBoardOpen,
              icon: <DownArrow />,
              tooltip: $webBroadcastContent.download_whiteboard
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
                onClick: toggleWhiteBoard,
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

        {/* {isDefaultGoLiveButton && (
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
        )} */}
        {isDefaultGoLiveButton && !joinAsParticipant &&(
          <Button
            onClick={onStartStage}
            variant="primary"
            className={clsm([
              'h-14',
              'dark:[&>svg]:fill-black',
              'relative',
              '[&>svg]:h-6',
              '[&>svg]:w-6',
              'space-x-1',
              'rounded-xl',
              'mt-10'
            ])}
            data-testid="web-broadcast-go-live-button"
          >
            <CreateVideo />
            <p>{$webBroadcastContent.start_stage}</p>
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
