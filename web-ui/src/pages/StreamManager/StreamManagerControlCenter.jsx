import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, forwardRef, useCallback, useRef } from 'react';

import {
  StreamManagerActions,
  StreamManagerChat,
  StreamManagerWebBroadcast
} from './streamManagerCards';
import { clsm } from '../../utils';
import { getLeavePromptText } from '../../helpers/stagesHelpers';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { streamManager as $content } from '../../content';
import { useBroadcast } from '../../contexts/Broadcast';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import BroadcastSettingsModal from './streamManagerCards/BroadcastSettingsModal';
import StageJoinModal from './streamManagerCards/StreamManagerWebBroadcast/FullScreenView/StageJoinModal';
import StageParticipantsModal from './streamManagerCards/StreamManagerWebBroadcast/StageModal/StageParticipantsModal';
import StreamManagerActionModal from './streamManagerCards/StreamManagerActions/StreamManagerActionModal';
import Tabs from '../../components/Tabs/Tabs';
import FullScreenView from './streamManagerCards/StreamManagerWebBroadcast/FullScreenView/FullScreenView';
import usePrompt from '../../hooks/usePrompt';
import { usePoll } from '../../contexts/StreamManagerActions/Poll';
import { MODAL_TYPE, useModal } from '../../contexts/Modal';
import { useStageManager } from '../../contexts/StageManager';
import useResize from '../../hooks/useResize';
import {
  initializeFullscreenOpen,
  STREAM_MODES,
  switchTabAndUpdateState,
  TAB_INDEX,
  updateAnimationInitialStates,
  updateFullscreenStates,
  updateGoLiveContainerStates,
  updateStreamMode,
  updateTabIndex
} from '../../reducers/streamManager';
import useDebouncedCallback from '../../hooks/useDebouncedCallback';
import usePrevious from '../../hooks/usePrevious';
import { updateError } from '../../reducers/shared';
import { streamManager as $streamManagerContent } from '../../content';

const $streamManagerNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const StreamManagerControlCenter = forwardRef(
  ({ setIsWebBroadcastAnimating }, previewRef) => {
    const dispatch = useDispatch();
    const {
      fullscreen: { isOpen: isFullscreenOpen },
      goLiveContainer,
      tabIndex
    } = useSelector((state) => state.streamManager);
    const { collaborate } = useSelector((state) => state.shared);
    const { user: userStage = null, stageControls } = useStageManager() || {};
    const { isBroadcasting } = useBroadcast();
    const { isActive: isPollActive } = usePoll();
    const { openModal } = useModal();
    const { isModalOpen, type: modalType } = useModal();
    const { isDesktopView, isMobileView, currentBreakpoint, isMobile } =
      useResponsiveDevice();
    const prevIsDesktopView = usePrevious(isDesktopView);

    // Refs
    const containerRef = useRef();
    const isPromptLockRef = useRef(false);

    // Stage
    const isStageActive = userStage?.isConnected;
    const isStageJoinModalOpen =
      isModalOpen && modalType === MODAL_TYPE.STAGE_JOIN;
    const isStreamActive = isStageActive || isBroadcasting;

    // Fullscreen
    const isOfflineMobileView =
      !isStageActive &&
      !isBroadcasting &&
      !isDesktopView &&
      !collaborate.isJoining;
    const isBroadcastingMobileView = isBroadcasting && !isDesktopView;
    const isFullScreenViewPortalOpen =
      isFullscreenOpen && !isBroadcastingMobileView && !isOfflineMobileView;

    // Prompt
    const enablePrompt =
      isBroadcasting ||
      isPollActive ||
      (isStageActive && !collaborate.isLeaving);

    const {
      isBlocked,
      onConfirm: onPromptConfirm,
      onCancel
    } = usePrompt(enablePrompt, !isStageActive);

    const handleTabSelection = (tabIndex) => {
      dispatch(switchTabAndUpdateState(tabIndex));
    };

    const handlePromptLeaveStage = useCallback(async () => {
      if (isPromptLockRef.current) return;

      isPromptLockRef.current = true;

      try {
        const { result, error } = await stageControls.leaveStage({
          isLeavingStreamManager: true
        });

        if (result) {
          onPromptConfirm();
        } else if (error) {
          console.error(error);
          dispatch(
            updateError(
              $streamManagerNotification.error.unable_to_leave_session
            )
          );
          onCancel();
        }
      } finally {
        isPromptLockRef.current = false;
      }
    }, [dispatch, onCancel, onPromptConfirm, stageControls]);

    /**
     * Page blocker prompt
     */
    useEffect(() => {
      if (isBlocked && !isPromptLockRef.current) {
        const { message, confirmText } = getLeavePromptText({
          isMobile,
          isPollActive,
          isStageActive,
          isBroadcasting
        });
        const onConfirm = isStageActive
          ? handlePromptLeaveStage
          : onPromptConfirm;

        openModal({
          content: {
            confirmText,
            isDestructive: true,
            message
          },
          onConfirm,
          onCancel
        });
      }
    }, [
      handlePromptLeaveStage,
      isBlocked,
      isBroadcasting,
      isMobile,
      isPollActive,
      isStageActive,
      onCancel,
      onPromptConfirm,
      openModal
    ]);

    /**
     * Only on desktop size screens,
     * While connecting to a real-time stage, open the fullscreen view with animation.
     * Case: Clicking the collaborate button from the "GoLive" component
     */
    useEffect(() => {
      if (isDesktopView && userStage && userStage.isConnecting) {
        dispatch(initializeFullscreenOpen());
      }
    }, [dispatch, isStageActive, isFullscreenOpen, userStage, isDesktopView]);

    useResize(
      useDebouncedCallback(() => {
        if (!containerRef.current) return;

        /**
         * The Stream manager container's offset left and top is used
         * to position the fullscreen component before it is expanded
         */

        const topOffset = isDesktopView ? 0 : 56; // tab height
        const leftOffset = isMobileView ? 0 : 64; // add sidebar width
        const initialLeftOffset = containerRef.current?.offsetLeft + leftOffset;
        const initialTopOffset = containerRef.current?.offsetTop + topOffset;

        dispatch(
          updateAnimationInitialStates({
            fullscreenLeft: initialLeftOffset,
            fullscreenTop: initialTopOffset
          })
        );
      }, 1000),
      { shouldCallOnMount: true }
    );

    const setupResponsiveStoreState = useCallback(() => {
      // When a stream is active on mobile, select the "GoLive" tab
      const tabIndex = isStreamActive
        ? TAB_INDEX.GO_LIVE
        : TAB_INDEX.MANAGE_STREAM;
      // On desktop view, the tab index should always be set to 0
      dispatch(
        updateTabIndex(isDesktopView ? TAB_INDEX.MANAGE_STREAM : tabIndex)
      );
      /**
       * On mobile view, hide the expand fullscreen button (fullscreen is not available).
       * On desktop view, if a stream is active, the container is opened.
       */
      dispatch(
        updateGoLiveContainerStates({
          isExpandButtonVisible: isDesktopView,
          isOpen: isStreamActive
        })
      );
      // On mobile view, close fullscreen view without animation
      if (!isDesktopView) {
        dispatch(
          updateFullscreenStates({
            isOpen: false,
            animate: false
          })
        );
      }
    }, [dispatch, isDesktopView, isStreamActive]);

    useEffect(() => {
      // Call "setupResponsiveStoreState" only when the view switches between desktop and mobile
      if (
        prevIsDesktopView === undefined ||
        prevIsDesktopView === isDesktopView
      )
        return;

      setupResponsiveStoreState();
    }, [isDesktopView, prevIsDesktopView, setupResponsiveStoreState]);

    /**
     * The fullscreen view should be opened when the stage join modal is visible.
     * This modal is visible when a user is joining a collaborate session.
     */
    const handleCollabJoiningStates = useCallback(() => {
      if (collaborate.isJoining && isStageJoinModalOpen) {
        dispatch(
          updateFullscreenStates({
            isOpen: true,
            animate: false
          })
        );
        dispatch(updateStreamMode(STREAM_MODES.REAL_TIME));
      }
    }, [collaborate.isJoining, dispatch, isStageJoinModalOpen]);

    useResize(handleCollabJoiningStates, { shouldCallOnMount: true });

    return (
      <div
        ref={containerRef}
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
          <StageJoinModal />
          <BroadcastSettingsModal />
          {!isDesktopView && (
            <Tabs.List
              selectedIndex={tabIndex}
              setSelectedIndex={handleTabSelection}
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
          <Tabs.Panel index={0} selectedIndex={tabIndex}>
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
                    goLiveContainer.isOpen && 'min-h-[calc(212px+395px)]' // firstRowOfStreamActionHeight+ expandedWebBroadcastHeight
                  ]
                ])}
              >
                {isDesktopView && (
                  <StreamManagerWebBroadcast
                    ref={previewRef}
                    isBroadcastCardOpen={goLiveContainer.isOpen}
                    setIsWebBroadcastAnimating={setIsWebBroadcastAnimating}
                  />
                )}
                <StreamManagerActions
                  className={clsm(
                    isDesktopView && [
                      goLiveContainer.isOpen
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
            <Tabs.Panel index={1} selectedIndex={tabIndex}>
              <StreamManagerWebBroadcast ref={previewRef} />
            </Tabs.Panel>
          )}
        </Tabs>
        <FullScreenView
          isOpen={isFullScreenViewPortalOpen}
          parentEl={document.body}
        />
      </div>
    );
  }
);

StreamManagerControlCenter.propTypes = {
  setIsWebBroadcastAnimating: PropTypes.func.isRequired
};

export default StreamManagerControlCenter;
