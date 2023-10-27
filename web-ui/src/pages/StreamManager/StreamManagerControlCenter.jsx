import PropTypes from 'prop-types';
import { useEffect, useRef, useState, forwardRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import {
  StreamManagerActions,
  StreamManagerChat,
  StreamManagerWebBroadcast
} from './streamManagerCards';
import { clsm } from '../../utils';
import { JOIN_PARTICIPANT_URL_PARAM_KEY } from '../../helpers/stagesHelpers';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { streamManager as $content } from '../../content';
import { useBroadcast } from '../../contexts/Broadcast';
import { useBroadcastFullScreen } from '../../contexts/BroadcastFullscreen';
import { useChannel } from '../../contexts/Channel';
import { useGlobalStage, useStreamManagerStage } from '../../contexts/Stage';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useStreams } from '../../contexts/Streams';
import BroadcastSettingsModal from './streamManagerCards/StreamManagerWebBroadcast/BroadcastSettingsModal';
import StageParticipantsModal from './streamManagerCards/StreamManagerWebBroadcast/StageModal/StageParticipantsModal';
import StreamManagerActionModal from './streamManagerCards/StreamManagerActions/StreamManagerActionModal';
import Tabs from '../../components/Tabs/Tabs';
import useDevicePermissionChangeListeners from '../../hooks/useDevicePermissionChangeListeners';
import useHostRejoin from './hooks/useHostRejoin';

const STREAM_MANAGER_DEFAULT_TAB = 0;
const GO_LIVE_TAB_INDEX = 1;

const StreamManagerControlCenter = forwardRef(
  ({ setIsWebBroadcastAnimating }, previewRef) => {
    useDevicePermissionChangeListeners();
    const { isStageActive } = useGlobalStage();
    const { handleHostRejoin } = useHostRejoin();
    const { isLive } = useStreams();
    const {
      webBroadcastParentContainerRef,
      isFullScreenViewOpen,
      setIsFullScreenViewOpen,
      initializeGoLiveContainerDimensions,
      handleOpenFullScreenView
    } = useBroadcastFullScreen();
    const { state } = useLocation();
    const { isDesktopView, currentBreakpoint } = useResponsiveDevice();
    const {
      initializeDevices,
      isBroadcasting,
      presetLayers,
      resetPreview,
      restartBroadcastClient,
      removeBroadcastClient
    } = useBroadcast();
    const {
      handleParticipantInvite,
      updateError,
      shouldGetHostRejoinTokenRef
    } = useStreamManagerStage();
    const { channelData } = useChannel();
    const { stageId: channelTableStageId } = channelData || {};
    const [searchParams] = useSearchParams();
    const stageIdUrlParam = searchParams.get(JOIN_PARTICIPANT_URL_PARAM_KEY);

    const areDevicesInitialized = useRef(false);
    const [selectedTabIndex, setSelectedTabIndex] = useState(
      state?.streamManagerSelectedTab || 0
    );
    const [isBroadcastCardOpen, setIsBroadcastCardOpen] = useState(
      state?.isWebBroadcastContainerOpen ||
        window.history.state?.isWebBroadcastContainerOpen ||
        !!stageIdUrlParam ||
        false
    );

    // Initialize devices when the user opens the broadcast card for the first time
    useEffect(() => {
      if (
        areDevicesInitialized.current ||
        !isBroadcastCardOpen ||
        stageIdUrlParam
      )
        return;

      (async function () {
        await initializeDevices();
        presetLayers.background.remove();
      })();

      areDevicesInitialized.current = true;
    }, [initializeDevices, presetLayers, isBroadcastCardOpen, stageIdUrlParam]);

    useEffect(() => {
      resetPreview();

      if (isDesktopView) {
        setSelectedTabIndex(STREAM_MANAGER_DEFAULT_TAB);
      }
    }, [
      isDesktopView,
      resetPreview,
      state,
      isBroadcasting,
      isFullScreenViewOpen
    ]);

    useEffect(() => {
      if (!isBroadcasting && isStageActive && !isDesktopView) {
        setSelectedTabIndex(GO_LIVE_TAB_INDEX);
      }
    }, [isBroadcasting, isDesktopView, isStageActive]);

    useEffect(() => {
      if (
        !isDesktopView &&
        window.history.state?.isWebBroadcastContainerOpen &&
        setSelectedTabIndex
      ) {
        setSelectedTabIndex(GO_LIVE_TAB_INDEX);
      }

      return () => {
        if (!window.history.state?.isWebBroadcastContainerOpen) return;
        window.history.replaceState({}, document.title);
      };
    }, [isDesktopView, setSelectedTabIndex]);

    useEffect(() => {
      if (!isStageActive && channelData && stageIdUrlParam) {
        const { avatar, color, username, channelAssetUrls } = channelData;
        const profileData = {
          avatar,
          profileColor: color,
          username,
          channelAssetUrls
        };
        handleParticipantInvite({
          isLive,
          isBroadcasting,
          profileData,
          openFullscreenView: () => {
            if (isDesktopView && handleOpenFullScreenView) {
              handleOpenFullScreenView();
            }
          }
        });
      }
    }, [
      channelData,
      handleParticipantInvite,
      initializeGoLiveContainerDimensions,
      isDesktopView,
      isStageActive,
      setIsFullScreenViewOpen,
      stageIdUrlParam,
      isLive,
      isBroadcasting,
      updateError,
      restartBroadcastClient,
      resetPreview,
      removeBroadcastClient,
      handleOpenFullScreenView
    ]);

    useEffect(() => {
      if (
        channelTableStageId &&
        !isStageActive &&
        !stageIdUrlParam &&
        shouldGetHostRejoinTokenRef.current
      ) {
        shouldGetHostRejoinTokenRef.current = false;
        setIsBroadcastCardOpen(true);

        handleHostRejoin(handleOpenFullScreenView);
      }
    }, [
      channelTableStageId,
      handleHostRejoin,
      handleOpenFullScreenView,
      isStageActive,
      shouldGetHostRejoinTokenRef,
      stageIdUrlParam
    ]);

    return (
      <div
        ref={webBroadcastParentContainerRef}
        className={clsm(['flex', 'h-full', 'w-full', 'max-w-[960px]'])}
      >
        <Tabs
          className={clsm([
            '[&>div]:px-0',
            '[&>div]:pt-0',
            '[&>div>button]:h-9'
          ])}
        >
          <StreamManagerActionModal />
          <StageParticipantsModal />
          <BroadcastSettingsModal />
          {!isDesktopView && (
            <Tabs.List
              selectedIndex={selectedTabIndex}
              setSelectedIndex={(tab) => {
                if (!isBroadcasting) {
                  setIsBroadcastCardOpen(tab === 1);
                }
                setSelectedTabIndex(tab);
              }}
              tabs={[
                {
                  label:
                    currentBreakpoint === 0
                      ? $content.stream_manager_web_broadcast.manage_stream.split(
                          ' '
                        )[0]
                      : $content.stream_manager_web_broadcast.manage_stream,
                  panelIndex: 0
                },
                {
                  label: $content.stream_manager_web_broadcast.go_live,
                  panelIndex: 1
                }
              ]}
            />
          )}
          <Tabs.Panel index={0} selectedIndex={selectedTabIndex}>
            <div
              className={clsm([
                'gap-6',
                'grid-cols-[351px,auto]',
                'grid',
                'grow',
                'h-full',
                'lg:grid-cols-none',
                'lg:grid-rows-[min-content,minmax(200px,100%)]',
                'max-w-[960px]',
                'w-full'
              ])}
            >
              <div
                className={clsm([
                  !isStageActive && 'overflow-hidden',
                  'h-full',
                  'relative',
                  'rounded-3xl',
                  'w-full',
                  isDesktopView && [
                    'min-h-[calc(212px+96px)]', // firstRowOfStreamActionHeight + collapsedWebBroadcastHeight
                    isBroadcastCardOpen && 'min-h-[calc(212px+395px)]' // firstRowOfStreamActionHeight+ expandedWebBroadcastHeight
                  ]
                ])}
              >
                {isDesktopView && (
                  <StreamManagerWebBroadcast
                    ref={previewRef}
                    isBroadcastCardOpen={isBroadcastCardOpen}
                    onExpand={() => setIsBroadcastCardOpen(true)}
                    onCollapse={() => setIsBroadcastCardOpen(false)}
                    setIsWebBroadcastAnimating={setIsWebBroadcastAnimating}
                  />
                )}
                <StreamManagerActions
                  className={clsm(
                    isDesktopView && [
                      isBroadcastCardOpen
                        ? [
                            'max-h-[calc(100vh-419px-72px-48px)]', // exclude expandedWebBroadcastHeight + statusBarHeight + space
                            'min-h-[188px]' // streamActionButtonHeight + space
                          ]
                        : [
                            'max-h-[calc(100vh-240px)]', // exclude statusBarHeight + collapsedWebBroadcastHeight + space
                            'min-h-[calc(100%-96px)]' // exclude collapsedWebBroadcastHeight + space
                          ]
                    ]
                  )}
                />
              </div>
              <NotificationProvider>
                <StreamManagerChat />
              </NotificationProvider>
            </div>
          </Tabs.Panel>
          {!isDesktopView && (
            <Tabs.Panel index={1} selectedIndex={selectedTabIndex}>
              <StreamManagerWebBroadcast
                ref={previewRef}
                isBroadcastCardOpen={isBroadcastCardOpen}
                onExpand={() => setIsBroadcastCardOpen(true)}
                onCollapse={() => setIsBroadcastCardOpen(false)}
              />
            </Tabs.Panel>
          )}
        </Tabs>
      </div>
    );
  }
);

StreamManagerControlCenter.propTypes = {
  setIsWebBroadcastAnimating: PropTypes.func.isRequired
};

export default StreamManagerControlCenter;
