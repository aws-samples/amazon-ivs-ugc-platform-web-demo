import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, m, useAnimation } from 'framer-motion';

import { BREAKPOINTS } from '../../constants';
import { clsm } from '../../utils';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';
import Chat from './Chat';
import FloatingNav from '../../layouts/AppLayoutWithNavbar/FloatingNav';
import MobileNavbar from '../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import PageUnavailable from '../../components/PageUnavailable';
import Player from '../../components/Player';
import useChannelData from '../../hooks/useChannelData';

const defaultTransition = { duration: 0.25, type: 'tween' };

const Channel = () => {
  const { username } = useParams();
  const { isSessionValid } = useUser();
  const { data: channelData, isLoading } = useChannelData(username);
  const { isLandscape, isMobileView, currentBreakpoint } =
    useMobileBreakpoint();
  const [isChatVisible, setIsChatVisible] = useState();
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
    [chatAnimationControls.set, chatAnimationControls.start]
  );

  useEffect(() => {
    if (isSplitView && !isLive) {
      toggleChat({ value: true }); // Show chat when stream goes offline in split view
      return;
    }

    toggleChat({ value: true, skipAnimation: true }); // Show chat and skip animation when the layout changes
  }, [isLive, isSplitView, isStackedView, toggleChat]);

  useEffect(() => {
    if (isChannelAvailable) setIsLive(isChannelLive);
  }, [isChannelAvailable, isChannelLive]);

  if (!isLoading && !isChannelAvailable) {
    return <PageUnavailable />;
  }

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
      <m.section
        animate={chatAnimationControls}
        initial="hidden"
        exit="hidden"
        variants={{
          visible: {
            x: 0,
            width: isSplitView ? 308 : isStackedView ? '100%' : 360
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
          'lg:min-h-[360px]',
          /* Split View */
          'md:landscape:w-[308px]',
          'md:landscape:h-screen',
          'md:landscape:min-h-[auto]',
          'touch-screen-device:lg:landscape:w-[308px]',
          'touch-screen-device:lg:landscape:h-screen',
          'touch-screen-device:lg:landscape:min-h-[auto]'
        ])}
      >
        <Chat
          chatRoomOwnerUsername={channelUsername}
          isChannelLoading={isLoading}
        />
        {isSplitView && !isSessionValid && (
          <MobileNavbar className={clsm(['px-5', 'pt-5', 'pb-6'])} />
        )}
      </m.section>
      {isSplitView && isSessionValid && (
        <m.div
          animate={chatAnimationControls}
          initial="hidden"
          exit="hidden"
          variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
          transition={defaultTransition}
        >
          <FloatingNav />
        </m.div>
      )}
      <AnimatePresence>
        {isSplitView && !isSessionValid && !isChatVisible && (
          <MobileNavbar className="lg:landscape:max-w-[calc(100vw_-_(352px_+_32px))]" />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Channel;
