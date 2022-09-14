import { m, AnimatePresence } from 'framer-motion';
import { memo, useCallback, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS, MODERATOR_PILL_TIMEOUT } from '../../../constants';
import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE } from './useChatConnection/utils';
import { clsm } from '../../../utils';
import { useChannel } from '../../../contexts/Channel';
import { useChatMessages } from '../../../contexts/ChatMessages';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useNotif } from '../../../contexts/Notification';
import { useUser } from '../../../contexts/User';
import ChatPopup from './ChatPopup';
import Composer from './Composer';
import ConnectingOverlay from './ConnectingOverlay';
import Messages from './Messages';
import MobileNavbar from '../../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import Notification from '../../../components/Notification';
import useChatConnection from './useChatConnection';

const $content = $channelContent.chat;
const defaultTransition = { duration: 0.25, type: 'tween' };

const Chat = ({ chatAnimationControls }) => {
  const chatContainerRef = useRef();
  const { isChannelLoading, refreshChannelData } = useChannel();
  const { isSessionValid, userData } = useUser();
  const { notifyError, notifyInfo, notifySuccess } = useNotif();
  const { isMobileView, isLandscape, currentBreakpoint } =
    useMobileBreakpoint();
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

  const { actions, chatUserRole, hasConnectionError, isConnecting, sendError } =
    useChatConnection({
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
    if (isModerator) {
      notifyInfo(
        $content.notifications.moderating,
        true,
        MODERATOR_PILL_TIMEOUT
      );
    }
  }, [isModerator, notifyInfo]);

  return (
    <m.section
      animate={chatAnimationControls}
      initial="visible"
      exit="hidden"
      variants={{
        visible: {
          x: 0,
          width: isSplitView ? 308 : isStackedView ? '100%' : 360,
          transitionEnd: { x: 0 }
        },
        hidden: { x: '100%', width: 0 }
      }}
      transition={defaultTransition}
      ref={chatContainerRef}
      className={clsm([
        'relative',
        'flex',
        'flex-shrink-0',
        'bg-white',
        'dark:bg-darkMode-gray-dark',
        'overflow-hidden',
        /* Default View */
        'w-[360px]',
        'h-screen',
        /* Stacked View */
        'lg:w-full',
        'lg:h-full',
        'lg:flex-grow',
        'lg:min-h-[200px]',
        /* Split View */
        'md:landscape:w-[308px]',
        'md:landscape:h-screen',
        'md:landscape:min-h-[auto]',
        'touch-screen-device:lg:landscape:w-[308px]',
        'touch-screen-device:lg:landscape:h-screen',
        'touch-screen-device:lg:landscape:min-h-[auto]'
      ])}
    >
      <Notification />
      <div
        className={clsm(
          [
            'relative',
            'flex',
            'flex-1',
            'flex-col',
            'items-center',
            'justify-between',
            'px-0.5'
          ],
          isSplitView && ['absolute', 'w-[308px]', 'h-screen']
        )}
      >
        <ConnectingOverlay isLoading={isLoading} />
        <Messages
          isChatPopupOpen={isChatPopupOpen}
          isModerator={isModerator}
          openChatPopup={openChatPopup}
        />
        {isMobileView && !isSessionValid ? (
          <MobileNavbar
            className={clsm(['absolute', 'px-5', 'pt-5', 'pb-6'])}
          />
        ) : (
          <Composer
            chatUserRole={chatUserRole}
            isDisabled={hasConnectionError}
            isLoading={isLoading}
            isFocusable={!isChatPopupOpen}
            sendError={sendError}
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
            selectedMessage={selectedMessage}
            setIsChatPopupOpen={setIsChatPopupOpen}
            openChatPopup={openChatPopup}
            isSplitView={isSplitView}
            parentEl={isSplitView ? document.body : chatContainerRef.current}
          />
        )}
      </AnimatePresence>
    </m.section>
  );
};

Chat.propTypes = { chatAnimationControls: PropTypes.object.isRequired };

export default memo(Chat);
