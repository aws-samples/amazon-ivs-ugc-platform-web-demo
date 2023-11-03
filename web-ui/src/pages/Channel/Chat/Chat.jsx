import { memo, useCallback, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence } from 'framer-motion';

import { BREAKPOINTS, MODERATOR_PILL_TIMEOUT } from '../../../constants';
import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE } from './useChatConnection/utils';
import { clsm, extractChannelIdfromChannelArn } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import { useChat } from '../../../contexts/Chat';
import { useNotif } from '../../../contexts/Notification';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useUser } from '../../../contexts/User';
import CelebrationViewerStreamAction from '../ViewerStreamActions/Celebration';
import ChatPopup from './ChatPopup';
import Composer from './Composer';
import ConnectingOverlay from './ConnectingOverlay';
import Messages from './Messages';
import Notification from '../../../components/Notification';
import useResizeObserver from '../../../hooks/useResizeObserver';
import Button from '../../../components/Button/Button';
import { useAppSync } from '../../../contexts/AppSync';
import { RequestInvite } from '../../../assets/icons';
import channelEvents from '../../../contexts/AppSync/channelEvents';
import { useGlobalStage } from '../../../contexts/Stage';
import Tooltip from '../../../components/Tooltip/Tooltip';
import { channelAPI } from '../../../api';

const $content = $channelContent.chat;

const Chat = ({ shouldRunCelebration }) => {
  const [chatContainerDimensions, setChatContainerDimensions] = useState();
  const { channelData, isChannelLoading } = useChannel();

  const { color: channelColor, isViewerBanned } = channelData || {};
  const { isSessionValid, userData } = useUser();
  const { notifyError, notifySuccess, notifyInfo } = useNotif();
  const {
    isLandscape,
    isMobileView,
    currentBreakpoint,
    mainRef,
    isProfileMenuOpen,
    isTouchscreenDevice
  } = useResponsiveDevice();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;
  const chatSectionRef = useRef();
  let chatPopupParentEl = chatSectionRef.current;

  if (isSplitView) chatPopupParentEl = document.body;
  else if (isStackedView) chatPopupParentEl = mainRef.current;

  const {
    actions,
    chatUserRole,
    hasConnectionError,
    isConnecting,
    sendAttemptError,
    deletedMessageIds,
    deletedMessage,
    setDeletedMessage,
    messages
  } = useChat();

  const isLoading = isConnecting || isChannelLoading;
  /**
   * Chat Moderation State and Actions
   */
  const isModerator = chatUserRole === CHAT_USER_ROLE.MODERATOR;
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({});
  const { publish } = useAppSync();
  const {
    isHost,
    participants,
    updateRequestingToJoinStage,
    requestingToJoinStage,
    updateError,
    updateSuccess
  } = useGlobalStage();

  const openChatPopup = useCallback(
    (messageData) => {
      setIsChatPopupOpen(true);
      setSelectedMessage(messageData);
    },
    [setSelectedMessage]
  );

  // Show moderation pill if user role is moderator
  useEffect(() => {
    if (isModerator && !isLoading) {
      setTimeout(
        () =>
          notifyInfo($content.notifications.moderating, {
            timeout: MODERATOR_PILL_TIMEOUT
          }),
        300 // Wait for the loading spinner exit transition to complete
      );
    }
  }, [isModerator, notifyInfo, isLoading]);

  const updateChatContainerDimensions = useCallback((elem) => {
    const { clientWidth, clientHeight } = elem;

    setChatContainerDimensions({ width: clientWidth, height: clientHeight });
  }, []);

  const handleDeleteMessage = useCallback(() => {
    const { id } = selectedMessage;
    actions.deleteMessage(id);
    deletedMessageIds.current.push(id);

    notifySuccess($content.notifications.success.message_removed);
  }, [selectedMessage, actions, deletedMessageIds, notifySuccess]);

  useResizeObserver(chatSectionRef, (entry) => {
    if (entry) updateChatContainerDimensions(entry.target);
  });

  useEffect(() => {
    if (chatSectionRef.current) {
      updateChatContainerDimensions(chatSectionRef.current);
    }
  }, [chatSectionRef, updateChatContainerDimensions]);

  useEffect(() => {
    if (deletedMessage && !isModerator) {
      const message = messages?.find(({ id }) => id === deletedMessage);
      if (message) {
        const {
          sender: {
            attributes: { channelArn: deletedMessageOwner }
          }
        } = message;
        if (
          extractChannelIdfromChannelArn(deletedMessageOwner.toLowerCase()) ===
          userData?.trackingId
        )
          notifyError($content.notifications.error.your_message_was_removed);
      }
      setDeletedMessage(undefined);
    }
  }, [
    deletedMessage,
    deletedMessageIds,
    isModerator,
    messages,
    notifyError,
    notifySuccess,
    selectedMessage.id,
    setDeletedMessage,
    userData
  ]);

  const requestToJoin = async () => {
    if (requestingToJoinStage) {
      updateRequestingToJoinStage(false);
      publish(
        channelData.username,
        JSON.stringify({
          type: channelEvents.STAGE_REVOKE_REQUEST_TO_JOIN,
          channelId: userData.channelId
        })
      );

      return;
    }

    const { result: streamStatus, error } =
      await channelAPI.getStreamLiveStatus();

    if (streamStatus?.isLive || !!error) {
      updateError({
        message: $channelContent.notifications.error.request_to_join_stage_fail,
        err: error
      });
    } else {
      updateSuccess(
        $channelContent.notifications.success.request_to_join_stage_success
      );
      updateRequestingToJoinStage(true);
      publish(
        channelData.username,
        JSON.stringify({
          type: channelEvents.STAGE_REQUEST_TO_JOIN,
          channelId: userData.channelId,
          sent: new Date().toString()
        })
      );
    }
  };

  const isRequestButtonVisible =
    !isHost && channelData?.stageId && userData?.username && !isViewerBanned;

  return (
    <>
      <div
        ref={chatSectionRef}
        className={clsm([
          (!isProfileMenuOpen || !isChatPopupOpen) && 'relative', // The container must be relative to contain the chat popup
          'flex',
          'flex-1',
          'flex-col',
          'items-center',
          'justify-between',
          'px-0.5'
        ])}
        data-testid="chat-component"
      >
        <div className={clsm(['relative', 'w-full', 'h-auto', 'flex'])}>
          <Notification />
        </div>
        <Messages
          isChatPopupOpen={isChatPopupOpen}
          isModerator={isModerator}
          openChatPopup={openChatPopup}
        />
        <CelebrationViewerStreamAction
          chatContainerDimensions={chatContainerDimensions}
          color={channelColor}
          shouldRun={shouldRunCelebration}
        />
        <ConnectingOverlay isLoading={isLoading} />
        {(!isMobileView || isSessionValid) && (
          <div
            className={clsm([
              'flex',
              'flex-row',
              'w-full',
              'pt-5',
              'pb-6',
              'px-[18px]',
              isRequestButtonVisible && ['gap-3']
            ])}
          >
            <Composer
              isRequestButtonVisible={isRequestButtonVisible}
              chatUserRole={chatUserRole}
              isDisabled={hasConnectionError}
              isFocusable={!isChatPopupOpen}
              isLoading={isLoading}
              sendAttemptError={sendAttemptError}
              sendMessage={actions.sendMessage}
            />

            {isRequestButtonVisible && (
              <Tooltip
                position="above"
                translate={{ y: 2 }}
                message={
                  requestingToJoinStage
                    ? $channelContent.request_to_join_stage_button.tooltip
                        .cancel_request
                    : $channelContent.request_to_join_stage_button.tooltip
                        .request_to_join
                }
              >
                <Button
                  className={clsm([
                    'w-11',
                    'h-11',
                    'dark:[&>svg]:fill-white',
                    '[&>svg]:fill-black',
                    'dark:bg-darkMode-gray',
                    !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                    'dark:focus:bg-darkMode-gray',
                    'bg-lightMode-gray',
                    requestingToJoinStage && [
                      'dark:[&>svg]:fill-black',
                      'dark:bg-darkMode-blue',
                      'dark:focus:bg-darkMode-blue',
                      'text-black',
                      'dark:hover:bg-darkMode-blue-hover'
                    ]
                  ])}
                  variant="icon"
                  // ref={toggleRef}
                  ariaLabel={'test'}
                  key="create-stage-control-btn"
                  // variant="icon"
                  onClick={requestToJoin}
                  isDisabled={participants?.size >= 12}
                >
                  <RequestInvite />
                </Button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {isChatPopupOpen && (
          <ChatPopup
            banUser={actions.banUser}
            deleteMessage={handleDeleteMessage}
            isOpen={isChatPopupOpen}
            openChatPopup={openChatPopup}
            parentEl={chatPopupParentEl}
            selectedMessage={selectedMessage}
            setIsChatPopupOpen={setIsChatPopupOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

Chat.defaultProps = {
  shouldRunCelebration: false
};

Chat.propTypes = {
  shouldRunCelebration: PropTypes.bool
};

export default memo(Chat);
