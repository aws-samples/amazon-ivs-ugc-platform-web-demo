import { AnimatePresence } from 'framer-motion';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS, MODERATOR_PILL_TIMEOUT } from '../../../constants';
import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE } from './useChatConnection/utils';
import { clsm } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import { useChatMessages } from '../../../contexts/ChatMessages';
import { useNotif } from '../../../contexts/Notification';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useUser } from '../../../contexts/User';
import CelebrationViewerStreamAction from '../ViewerStreamActions/Celebration';
import ChatPopup from './ChatPopup';
import Composer from './Composer';
import ConnectingOverlay from './ConnectingOverlay';
import Messages from './Messages';
import Notification from '../../../components/Notification';
import useChatConnection from './useChatConnection';
import useResizeObserver from '../../../hooks/useResizeObserver';

const $content = $channelContent.chat;

const Chat = ({ shouldRunCelebration }) => {
  const [chatContainerDimensions, setChatContainerDimensions] = useState();
  const { channelData, isChannelLoading, refreshChannelData } = useChannel();

  const { color: channelColor } = channelData || {};
  const { isSessionValid, userData } = useUser();
  const { notifyError, notifyInfo, notifySuccess } = useNotif();
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
  /**
   * Chat Event Handlers
   */
  const {
    deletedMessageIds,
    removeMessage,
    removeMessageByUserId,
    sentMessageIds
  } = useChatMessages();
  const handleDeleteMessage = useCallback(
    (messageId) => {
      removeMessage(messageId);
      if (deletedMessageIds.current.includes(messageId)) {
        notifySuccess($content.notifications.success.message_removed);
      } else if (sentMessageIds.current.includes(messageId)) {
        notifyError($content.notifications.error.your_message_was_removed);
      }
    },
    [
      deletedMessageIds,
      notifyError,
      notifySuccess,
      removeMessage,
      sentMessageIds
    ]
  );
  const handleUserDisconnect = useCallback(
    (bannedUsername) => {
      if (bannedUsername.includes(userData?.trackingId)) {
        // This user has been banned
        notifyError($content.notifications.error.you_have_been_banned);
        refreshChannelData();
      }
    },
    [notifyError, refreshChannelData, userData?.trackingId]
  );

  const {
    actions,
    chatUserRole,
    hasConnectionError,
    isConnecting,
    sendAttemptError
  } = useChatConnection({
    handleDeleteMessage,
    handleDeleteUserMessages: removeMessageByUserId,
    handleUserDisconnect
  });
  const isLoading = isConnecting || isChannelLoading;

  /**
   * Chat Moderation State and Actions
   */
  const isModerator = chatUserRole === CHAT_USER_ROLE.MODERATOR;
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({});
  const openChatPopup = useCallback((messageData) => {
    setIsChatPopupOpen(true);
    setSelectedMessage(messageData);
  }, []);

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

  useResizeObserver(chatSectionRef, (entry) => {
    if (entry) updateChatContainerDimensions(entry.target);
  });

  useEffect(() => {
    if (chatSectionRef.current) {
      updateChatContainerDimensions(chatSectionRef.current);
    }
  }, [chatSectionRef, updateChatContainerDimensions]);

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
            deleteMessage={actions.deleteMessage}
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
