import { useAnimation } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

import { BREAKPOINTS } from '../../constants';
import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { useChannel } from '../../contexts/Channel';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import Chat from './Chat';
import MobileNavbar from '../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import PageUnavailable from '../../components/PageUnavailable';
import Player from '../../components/Player';

const Channel = () => {
  const { isSessionValid } = useUser();
  const { isLandscape, isMobileView, currentBreakpoint } =
    useResponsiveDevice();
  const { channelData, channelError } = useChannel();
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
        isLandscape && [
          'md:flex-row',
          'md:h-screen',
          'touch-screen-device:lg:flex-row',
          'touch-screen-device:lg:h-screen'
        ]
      ])}
    >
      <Player
        isChatVisible={isChatVisible}
        toggleChat={toggleChat}
        channelData={channelData}
      />
      <NotificationProvider>
        <Chat chatAnimationControls={chatAnimationControls} />
      </NotificationProvider>
      {isSplitView && !isSessionValid && !isChatVisible && (
        <MobileNavbar
          className={clsm(
            isLandscape && 'lg:max-w-[calc(100vw_-_(352px_+_32px))]'
          )}
        />
      )}
    </div>
  );
};

export default Channel;
