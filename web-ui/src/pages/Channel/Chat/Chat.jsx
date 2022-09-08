import { m } from 'framer-motion';
import { memo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import { BREAKPOINTS } from '../../../constants';
import { clsm, noop } from '../../../utils';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import ChatPopup from './ChatPopup';
import Composer from './Composer';
import ConnectingOverlay from './ConnectingOverlay';
import Messages from './Messages';
import MobileNavbar from '../../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import Notification from '../../../components/Notification';
import useChat from './useChat';

const defaultTransition = { duration: 0.25, type: 'tween' };

const Chat = ({
  chatRoomOwnerUsername,
  chatAnimationControls,
  isChannelLoading,
  isViewerBanned
}) => {
  const { isSessionValid } = useUser();
  const { isMobileView, isLandscape, currentBreakpoint } =
    useMobileBreakpoint();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;

  const handleDeleteMessage = useCallback(noop, []); // Temporary
  const handleDeleteUserMessages = useCallback(noop, []); // Temporary
  const handleUserDisconnect = useCallback(noop, []); // Temporary

  const {
    chatUserRole,
    hasConnectionError,
    isConnecting,
    sendMessage,
    sendError
  } = useChat(chatRoomOwnerUsername, isViewerBanned, {
    handleDeleteMessage,
    handleDeleteUserMessages,
    handleUserDisconnect
  });
  const isLoading = isConnecting || isChannelLoading;
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState({});

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
            isDisabled={hasConnectionError}
            chatUserRole={chatUserRole}
            sendMessage={sendMessage}
            sendError={sendError}
          />
        )}
      </div>
    </m.section>
  );
};

Chat.defaultProps = {
  chatRoomOwnerUsername: '',
  isChannelLoading: false,
  isViewerBanned: false
};

Chat.propTypes = {
  chatRoomOwnerUsername: PropTypes.string,
  chatAnimationControls: PropTypes.object.isRequired,
  isChannelLoading: PropTypes.bool,
  isViewerBanned: PropTypes.bool
};

export default memo(Chat);
