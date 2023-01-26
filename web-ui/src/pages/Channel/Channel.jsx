import { motion, useAnimationControls } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  BREAKPOINTS,
  DEFAULT_PROFILE_VIEW_TRANSITION,
  STREAM_ACTION_NAME
} from '../../constants';
import { channel as $channelContent } from '../../content';
import { clsm } from '../../utils';
import { createAnimationProps } from '../../helpers/animationPropsHelper';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import { useChannel } from '../../contexts/Channel';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import { useUser } from '../../contexts/User';
import { useViewerStreamActions } from '../../contexts/ViewerStreamActions';
import Chat from './Chat';
import MobileNavbar from '../../layouts/AppLayoutWithNavbar/Navbar/MobileNavbar';
import PageUnavailable from '../../components/PageUnavailable';
import Player from './Player';
import ProductDescriptionModal from './ViewerStreamActions/Product/ProductDescriptionModal';
import ProductViewerStreamAction from './ViewerStreamActions/Product';
import QuizViewerStreamAction from './ViewerStreamActions/QuizCard';
import Tabs from '../../components/Tabs/Tabs';

const DEFAULT_SELECTED_TAB_INDEX = 0;
const CHAT_PANEL_TAB_INDEX = 1;

const Channel = () => {
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    DEFAULT_SELECTED_TAB_INDEX
  );
  const { channelError } = useChannel();
  const {
    currentViewerStreamActionData,
    currentViewerStreamActionName,
    currentViewerStreamActionTitle,
    setCurrentViewerAction,
    shouldRenderActionInTab
  } = useViewerStreamActions();
  const { isLandscape, isMobileView, currentBreakpoint } =
    useResponsiveDevice();
  const { isSessionValid } = useUser();
  const chatAnimationControls = useAnimationControls();
  const chatContainerRef = useRef();
  const isSplitView = isMobileView && isLandscape;
  const isStackedView = currentBreakpoint < BREAKPOINTS.lg;

  const toggleChat = useCallback(
    ({ value, skipAnimation } = {}) => {
      const transitionFn = skipAnimation
        ? chatAnimationControls.set
        : chatAnimationControls.start;

      setIsChatVisible((prev) => {
        const next = value !== undefined && value !== null ? value : !prev;

        transitionFn(next ? 'visible' : 'hidden-initial');

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
      <NotificationProvider>
        <Player isChatVisible={isChatVisible} toggleChat={toggleChat} />
      </NotificationProvider>
      <ProductDescriptionModal />
      <motion.section
        ref={chatContainerRef}
        {...createAnimationProps({
          customVariants: {
            visible: {
              width: isSplitView ? 308 : isStackedView ? '100%' : 360
            },
            hidden: { width: 0 }
          },
          controls: chatAnimationControls,
          options: { shouldAnimateIn: false },
          transition: DEFAULT_PROFILE_VIEW_TRANSITION
        })}
        className={clsm([
          'relative',
          'flex',
          'flex-grow',
          'shrink-0',
          'min-h-[200px]',
          'overflow-hidden',
          /* Default View */
          'h-screen',
          /* Stacked View */
          'lg:h-full',
          /* Split View */
          isLandscape && [
            'md:h-screen',
            'md:min-h-[auto]',
            'touch-screen-device:lg:w-[308px]',
            'touch-screen-device:lg:h-screen',
            'touch-screen-device:lg:min-h-[auto]'
          ]
        ])}
      >
        <div
          ref={chatContainerRef}
          className={clsm([
            'relative',
            'flex',
            'bg-white',
            'dark:bg-darkMode-gray-dark',
            /* Default View */
            'min-w-[360px]',
            /* Stacked View */
            'lg:min-w-full',
            /* Split View */
            isLandscape && [
              'md:min-w-[308px]',
              'touch-screen-device:lg:min-w-[308px]'
            ]
          ])}
        >
          <Tabs>
            {shouldRenderActionInTab && (
              <>
                <Tabs.List
                  selectedIndex={selectedTabIndex}
                  setSelectedIndex={setSelectedTabIndex}
                  tabs={[
                    { label: currentViewerStreamActionTitle, panelIndex: 0 },
                    { label: $channelContent.tabs.chat, panelIndex: 1 }
                  ]}
                />
                <Tabs.Panel index={0} selectedIndex={selectedTabIndex}>
                  {currentViewerStreamActionName ===
                    STREAM_ACTION_NAME.QUIZ && (
                    <QuizViewerStreamAction
                      {...currentViewerStreamActionData}
                      setCurrentViewerAction={setCurrentViewerAction}
                      shouldRenderActionInTab={shouldRenderActionInTab}
                    />
                  )}
                  {currentViewerStreamActionName ===
                    STREAM_ACTION_NAME.PRODUCT && (
                    <div
                      className={clsm([
                        'absolute',
                        'h-full',
                        'no-scrollbar',
                        'overflow-x-hidden',
                        'overflow-y-auto',
                        'pb-5',
                        'px-5',
                        'supports-overlay:overflow-y-overlay',
                        'w-full'
                      ])}
                    >
                      <ProductViewerStreamAction
                        {...currentViewerStreamActionData}
                      />
                    </div>
                  )}
                </Tabs.Panel>
              </>
            )}
            <Tabs.Panel
              index={1}
              selectedIndex={
                shouldRenderActionInTab
                  ? selectedTabIndex
                  : CHAT_PANEL_TAB_INDEX
              }
            >
              <NotificationProvider>
                <Chat
                  chatContainerRef={chatContainerRef}
                  shouldRunCelebration={
                    currentViewerStreamActionName ===
                    STREAM_ACTION_NAME.CELEBRATION
                  }
                />
              </NotificationProvider>
            </Tabs.Panel>
          </Tabs>
        </div>
      </motion.section>
      {isSplitView && !isSessionValid && !isChatVisible && (
        <MobileNavbar
          className={clsm(
            isLandscape && 'lg:max-w-[calc(100vw_-_(352px_+_96px))]'
          )}
        />
      )}
    </div>
  );
};

export default Channel;
