import { useAnimation } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { BREAKPOINTS } from '../../constants';
import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';
import Chat from './Chat';
import MobileNavbar from '../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import PageUnavailable from '../../components/PageUnavailable';
import Player from '../../components/Player';
import useChannelData from '../../hooks/useChannelData';

const Channel = () => {
  const { username } = useParams();
  const { channelData, channelError, isChannelLoading } =
    useChannelData(username);
  const { isSessionValid } = useUser();
  const { isLandscape, isMobileView, currentBreakpoint } =
    useMobileBreakpoint();
  const { username: channelUsername, isViewerBanned } = channelData || {};
  const [isChatVisible, setIsChatVisible] = useState(true);
  const chatAnimationControls = useAnimation();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;

  const toggleChat = useCallback(
    ({ value, skipAnimation } = {}) => {
      const transitionFn = skipAnimation
        ? chatAnimationControls.set
        : chatAnimationControls.start;

      setIsChatVisible((prev) => {
        const next = value || !prev;

        transitionFn(next ? 'visible' : 'hidden');

        return next;
      });
    },
    [chatAnimationControls]
  );

  // Show chat and skip animation when the layout changes
  useEffect(() => {
    toggleChat({ value: true, skipAnimation: true });
  }, [isSplitView, isStackedView, toggleChat]);

  if (channelError) return <PageUnavailable />;

  return (
    <div
      className={clsm([
        'flex',
        'items-center',
        'justify-center',
        'text-center',
        'overflow-x-hidden',
        /* Default View */
        'w-full',
        'h-screen',
        'flex-row',
        /* Stacked View */
        'lg:flex-col',
        'lg:h-full',
        'lg:min-h-screen',
        /* Split View */
        'md:landscape:flex-row',
        'md:landscape:h-screen',
        'touch-screen-device:lg:landscape:flex-row',
        'touch-screen-device:lg:landscape:h-screen'
      ])}
    >
      <Player
        isChatVisible={isChatVisible}
        toggleChat={toggleChat}
        channelData={channelData}
      />
      <NotificationProvider>
        <Chat
          chatRoomOwnerUsername={channelUsername}
          chatAnimationControls={chatAnimationControls}
          isChannelLoading={isChannelLoading}
          isViewerBanned={isViewerBanned}
        />
      </NotificationProvider>
      {isSplitView && !isSessionValid && !isChatVisible && (
        <MobileNavbar className="lg:landscape:max-w-[calc(100vw_-_(352px_+_32px))]" />
      )}
    </div>
  );
};

export default Channel;
