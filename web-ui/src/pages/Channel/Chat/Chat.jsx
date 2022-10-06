import { AnimatePresence } from 'framer-motion';
import { memo, useCallback, useState, useEffect } from 'react';
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
import ChatPopup from './ChatPopup';
import Composer from './Composer';
import ConnectingOverlay from './ConnectingOverlay';
import Messages from './Messages';
import MobileNavbar from '../../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import Notification from '../../../components/Notification';
import useChatConnection from './useChatConnection';

const $content = $channelContent.chat;

const Chat = ({ chatContainerRef, menuPopupSiblingRef }) => {
  const { isChannelLoading, refreshChannelData } = useChannel();
  const { isSessionValid, userData } = useUser();
  const { notifyError, notifyInfo, notifySuccess } = useNotif();
  const { isLandscape, isMobileView, currentBreakpoint } =
    useResponsiveDevice();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;
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
      if (userData?.username === bannedUsername) {
        // This user has been banned
        notifyError($content.notifications.error.you_have_been_banned);
        refreshChannelData();
      }
    },
    [notifyError, refreshChannelData, userData?.username]
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

  return (
    <>
      <Notification />
      <div
        className={clsm([
          'relative',
          'flex',
          'flex-1',
          'flex-col',
          'items-center',
          'justify-between',
          'px-0.5'
        ])}
      >
        <ConnectingOverlay isLoading={isLoading} />
        <Messages
          isChatPopupOpen={isChatPopupOpen}
          isModerator={isModerator}
          openChatPopup={openChatPopup}
        />
        {isMobileView && !isSessionValid ? (
          <MobileNavbar
            className={clsm([
              'pb-6',
              'pt-5',
              'px-5',
              'static',
              'translate-x-0'
            ])}
          />
        ) : (
          <Composer
            menuPopupSiblingRef={menuPopupSiblingRef}
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
            isStackedView={isStackedView}
            openChatPopup={openChatPopup}
            parentEl={isSplitView ? document.body : chatContainerRef.current}
            selectedMessage={selectedMessage}
            setIsChatPopupOpen={setIsChatPopupOpen}
          />
        )}
      </AnimatePresence>
    </>
  );
};

Chat.defaultProps = {
  chatContainerRef: null,
  menuPopupSiblingRef: null
};

Chat.propTypes = {
  chatContainerRef: PropTypes.object,
  menuPopupSiblingRef: PropTypes.object
};

export default memo(Chat);
