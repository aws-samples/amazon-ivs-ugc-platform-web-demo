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
    isProfileMenuOpen
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
  const { publish } = useAppSync()
  const { isHost, participants } = useGlobalStage()

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
          {/* <Tooltip
            key="stage-control-tooltip-collaborate"
            position="above"
            translate={{ y: 2 }}
            message="Request to join"
          > */}
          {!isHost && channelData?.stageId && userData?.username && !isViewerBanned &&
            <Button
              ariaLabel={"test"}
              key="create-stage-control-btn"
              variant="icon"
              onClick={() => {
                console.log('channel data -->', channelData)
                publish(channelData.username, JSON.stringify({ type: channelEvents.STAGE_REQUEST_TO_JOIN, username: userData.username, sent: new Date().toString() }))
              }}
              className={clsm([
                'bg-lightMode-gray'
              ])}
              isDisabled={participants?.size >= 12}
            >
              <RequestInvite />
            </Button>
            }
          {/* </Tooltip> */}
        <ConnectingOverlay isLoading={isLoading} />
        {(!isMobileView || isSessionValid) && (
          <Composer
            chatUserRole={chatUserRole}
            isDisabled={hasConnectionError}
            isFocusable={!isChatPopupOpen}
            isLoading={isLoading}
            sendAttemptError={sendAttemptError}
            sendMessage={actions.sendMessage}
          />
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
