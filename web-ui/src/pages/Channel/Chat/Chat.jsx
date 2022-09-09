import { m } from 'framer-motion';
import { memo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS, MODERATOR_PILL_TIMEOUT } from '../../../constants';
import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE } from './useChatConnection/utils';
import { clsm, noop } from '../../../utils';
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

const Chat = ({
  chatRoomOwnerUsername,
  chatAnimationControls,
  isChannelLoading,
  isViewerBanned,
  refreshChannelData
}) => {
  const { removeMessageByUserId } = useChatMessages();
  const { isSessionValid, userData } = useUser();
  const { notifyError } = useNotif();
  const { isMobileView, isLandscape, currentBreakpoint } =
    useMobileBreakpoint();
  const { notifyInfo } = useNotif();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;

  const handleDeleteMessage = useCallback(noop, []); // Temporary

  const handleDeleteUserMessages = useCallback(
    (userId) => removeMessageByUserId(userId),
    [removeMessageByUserId]
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
    chatUserRole,
    hasConnectionError,
    isConnecting,
    sendMessage,
    sendError
  } = useChatConnection(
    chatRoomOwnerUsername,
    isViewerBanned,
    refreshChannelData,
    {
      handleDeleteMessage,
      handleDeleteUserMessages,
      handleUserDisconnect
    }
  );
  const isLoading = isConnecting || isChannelLoading;
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({});

  // Show moderation pill if user role is moderator
  useEffect(() => {
    if (chatUserRole === CHAT_USER_ROLE.MODERATOR)
      notifyInfo(
        $content.notifications.moderating,
        true,
        MODERATOR_PILL_TIMEOUT
      );
  }, [chatUserRole, notifyInfo]);

  const openChatPopup = useCallback((message, avatar, color, displayName) => {
    const selectedMessage = { message, avatar, color, displayName };
    setIsChatPopupOpen(true);
    setSelectedMessage(selectedMessage);
  }, []);

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
      className={clsm([
        'relative',
        'overflow-hidden',
        'flex',
        'flex-shrink-0',
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray-dark',
        'overflow-x-hidden',
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
      <ChatPopup
        isOpen={isChatPopupOpen}
        setIsChatPopupOpen={setIsChatPopupOpen}
        selectedMessage={selectedMessage}
        openChatPopup={openChatPopup}
      />
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
          chatRoomOwnerUsername={chatRoomOwnerUsername}
          openChatPopup={openChatPopup}
        />
        {isMobileView && !isSessionValid ? (
          <MobileNavbar
            className={clsm(['absolute', 'px-5', 'pt-5', 'pb-6'])}
          />
        ) : (
          <Composer
            chatUserRole={chatUserRole}
            sendMessage={sendMessage}
            sendError={sendError}
            isLocked={isViewerBanned}
            isDisabled={hasConnectionError}
          />
        )}
      </div>
    </m.section>
  );
};

Chat.defaultProps = {
  chatRoomOwnerUsername: '',
  isChannelLoading: false,
  isViewerBanned: undefined
};

Chat.propTypes = {
  chatAnimationControls: PropTypes.object.isRequired,
  chatRoomOwnerUsername: PropTypes.string,
  isChannelLoading: PropTypes.bool,
  isViewerBanned: PropTypes.bool,
  refreshChannelData: PropTypes.func.isRequired
};

export default memo(Chat);
