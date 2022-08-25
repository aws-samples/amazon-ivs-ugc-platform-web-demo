import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAnimation } from 'framer-motion';

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
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isLive, setIsLive] = useState();
  const chatAnimationControls = useAnimation();
  const isChannelAvailable = !!channelData;
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;
  const {
    isLive: isChannelLive,
    playbackUrl,
    username: channelUsername
  } = channelData || {};

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

  useEffect(() => {
    if (isChannelAvailable) setIsLive(isChannelLive);
  }, [isChannelAvailable, isChannelLive]);

  // Show chat when stream goes offline in split view
  useEffect(() => {
    if (isSplitView && !isLive) {
      toggleChat({ value: true, skipAnimation: true });
    }
  }, [isLive, isSplitView, toggleChat]);

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
        isLive={isLive}
        setIsLive={setIsLive}
        playbackUrl={playbackUrl}
        isChatVisible={isChatVisible}
        toggleChat={toggleChat}
      />
      <NotificationProvider>
        <Chat
          chatRoomOwnerUsername={channelUsername}
          chatAnimationControls={chatAnimationControls}
          isChannelLoading={isChannelLoading}
        />
      </NotificationProvider>
      {isSplitView && !isSessionValid && !isChatVisible && (
        <MobileNavbar className="lg:landscape:max-w-[calc(100vw_-_(352px_+_32px))]" />
      )}
    </div>
  );
};

export default Channel;
