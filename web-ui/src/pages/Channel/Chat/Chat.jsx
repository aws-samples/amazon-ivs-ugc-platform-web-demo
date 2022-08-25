import PropTypes from 'prop-types';
import { memo } from 'react';
import { m } from 'framer-motion';

import { BREAKPOINTS } from '../../../constants';
import { clsm } from '../../../utils';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
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
  isChannelLoading
}) => {
  const { isSessionValid } = useUser();
  const { isMobileView, isLandscape, currentBreakpoint } =
    useMobileBreakpoint();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;

  const { chatUserRole, hasConnectionError, isConnecting, sendMessage } =
    useChat(chatRoomOwnerUsername);
  const isLoading = isConnecting || isChannelLoading;

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
      <Notification />
      <div
        className={clsm([
          'relative',
          'flex',
          'flex-1',
          'flex-col',
          'items-center',
          'justify-between',
          'px-0.5',
          'z-40'
        ])}
      >
        <ConnectingOverlay isLoading={isLoading} />
        <Messages chatRoomOwnerUsername={chatRoomOwnerUsername} />
        {isMobileView && !isSessionValid ? (
          <MobileNavbar
            className={clsm(['absolute', 'px-5', 'pt-5', 'pb-6'])}
          />
        ) : (
          <Composer
            isDisabled={hasConnectionError}
            chatUserRole={chatUserRole}
            sendMessage={sendMessage}
          />
        )}
      </div>
    </m.section>
  );
};

Chat.defaultProps = {
  chatRoomOwnerUsername: '',
  isChannelLoading: false
};

Chat.propTypes = {
  chatRoomOwnerUsername: PropTypes.string,
  chatAnimationControls: PropTypes.object.isRequired,
  isChannelLoading: PropTypes.bool
};

export default memo(Chat);
