import { useEffect, useRef, forwardRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { useChannel } from '../../../../contexts/Channel';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useUser } from '../../../../contexts/User';
import useDebouncedCallback from '../../../../hooks/useDebouncedCallback';
import useResize from '../../../../hooks/useResize';
import { useLocation } from 'react-router-dom';
import useResizeObserver from '../../../../hooks/useResizeObserver';

// Static heights based on design
const COMPOSER_HEIGHT_PX = 92;
const VOTE_BUTTON_HEIGHT_PX = 60;
const PROGRESS_BAR_HEIGHT_PX = 46;
const FOOTER_HEIGHT_PX =
  VOTE_BUTTON_HEIGHT_PX + PROGRESS_BAR_HEIGHT_PX;
const SPACE_BETWEEN_POLL_AND_COMPOSER_PX = 20;

const PollContainer = forwardRef(({ children }, ref) => {
  const marginBotttomRef = useRef();
  const [height, setHeight] = useState();
  const fullHeightOfPoll = useRef();
  const { channelData } = useChannel();
  const {
    hasScrollbar,
    isVoting,
    hasPollEnded,
    composerRefState,
    dispatchPollState
  } = usePoll();

  const { isTouchscreenDevice, isLandscape, isDesktopView } =
    useResponsiveDevice();
  const { isSessionValid, userData = {} } = useUser();
  const { pathname } = useLocation();
  const { color } = channelData || {};
  const pollComponent = ref?.current;
  const composerComponent = composerRefState?.current;

  let previousHeight = window.innerHeight;

  const getScrollableContentHeight = (windowHeight, hasPollEnded, isVoting) => {
    if (hasPollEnded) {
      return (
        windowHeight - COMPOSER_HEIGHT_PX - SPACE_BETWEEN_POLL_AND_COMPOSER_PX
      );
    }

    // Logged out
    if (!userData?.username) {
      return (
        windowHeight -
        COMPOSER_HEIGHT_PX -
        SPACE_BETWEEN_POLL_AND_COMPOSER_PX -
        PROGRESS_BAR_HEIGHT_PX
      );
    }

    return (
      windowHeight -
      COMPOSER_HEIGHT_PX -
      SPACE_BETWEEN_POLL_AND_COMPOSER_PX -
      (isVoting
        ? FOOTER_HEIGHT_PX
        : PROGRESS_BAR_HEIGHT_PX)
    );
  };

  useEffect(() => {
    marginBotttomRef.current =
      isLandscape || !isSessionValid ? 'mb-28' : 'mb-0';
  }, [isTouchscreenDevice, isLandscape, isSessionValid]);

  useEffect(() => {
    // Recalculate the height of the poll if user has voted or the poll has ended
    if (fullHeightOfPoll?.current && (!isVoting || hasPollEnded)) {
        const scrollableContentHeight = getScrollableContentHeight(
          window.innerHeight,
          hasPollEnded,
          isVoting
        );
          
        const heightToFill = window.innerHeight - COMPOSER_HEIGHT_PX - SPACE_BETWEEN_POLL_AND_COMPOSER_PX
        const calculatedPollHeight = ref.current.scrollHeight + PROGRESS_BAR_HEIGHT_PX

        if (calculatedPollHeight > heightToFill) {
          setHeight(scrollableContentHeight)
          dispatchPollState({ hasScrollbar: true });
        } else {
          setHeight('100%')
          dispatchPollState({ hasScrollbar: false });
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPollEnded, isVoting]);

  useResize(
    useDebouncedCallback(() => {
      if (pollComponent && composerComponent) {
        const poll = pollComponent?.getBoundingClientRect();
        const composer = composerComponent?.getBoundingClientRect();
        const scrollableContentHeight = getScrollableContentHeight(
          window.innerHeight,
          hasPollEnded,
          isVoting
        );

        // Mounting
        if (!fullHeightOfPoll?.current) {
          fullHeightOfPoll.current = ref?.current?.scrollHeight;

          const overlapY =
            poll.bottom > composer?.top && poll?.top < composer?.bottom;
          const distanceY = Math.abs(poll?.bottom - composer?.top);
          const shouldAddScrollBar = overlapY || distanceY < 20;

          if (shouldAddScrollBar) {
            setHeight(scrollableContentHeight);
            dispatchPollState({ hasScrollbar: true });
          }
        } else {
          // Resizing
          const isDecreasingBrowserHeight = window.innerHeight < previousHeight

          if (isDecreasingBrowserHeight) {
            const distanceY =
              poll?.bottom -
              composer?.top +
              (hasScrollbar ? FOOTER_HEIGHT_PX : 0);

            if (distanceY > -20) {
              setHeight(scrollableContentHeight);
              dispatchPollState({ hasScrollbar: true });
            }
          } else { // Increasing browser height
            if (height === '100%') return
  
            let calculatedPollHeight = scrollableContentHeight;

            if (!userData?.username) {
              calculatedPollHeight +=
                PROGRESS_BAR_HEIGHT_PX;
            } else {
              calculatedPollHeight += isVoting
                ? FOOTER_HEIGHT_PX
                : PROGRESS_BAR_HEIGHT_PX;
            }
            
            const shouldRemoveScrollbar =
              (isVoting && calculatedPollHeight > fullHeightOfPoll?.current)
              || (!isVoting && ref.current.scrollHeight + PROGRESS_BAR_HEIGHT_PX < window.innerHeight - COMPOSER_HEIGHT_PX - SPACE_BETWEEN_POLL_AND_COMPOSER_PX)
              || (hasPollEnded && ref.current.scrollHeight < window.innerHeight - COMPOSER_HEIGHT_PX - SPACE_BETWEEN_POLL_AND_COMPOSER_PX)


            if (shouldRemoveScrollbar) {
              setHeight('100%')
              dispatchPollState({ hasScrollbar: false });
            } else {
              setHeight(scrollableContentHeight)
              dispatchPollState({ hasScrollbar: true });
            }
          }

          previousHeight = window.innerHeight;
        }
      }
    }, 200),
    { shouldCallOnMount: true }
  );
  const isStreamManagerPage = pathname === '/manager';

  return (
    <div
      style={{ 
        border: '2px solid red',
      }}
      className={clsm([
        'overflow-hidden',
        'rounded-xl',
        'm-5',
        isDesktopView &&
          !isStreamManagerPage &&
          hasScrollbar && !hasPollEnded && ['rounded-b-none', 'mb-0']
      ])}
    >
      <div
        style={{
          height: isDesktopView && !isStreamManagerPage && height
        }}
        ref={ref}
        className={clsm([
          isDesktopView &&
            !isStreamManagerPage &&
            hasScrollbar &&
            'overflow-y-scroll',
          'p-5',
          hasPollEnded && 'pb-7',
          `bg-profile-${color}`,
          `scrollbar-color-poll-${color}-scrollBarThumb`
        ])}
      >
        {children}
      </div>
    </div>
  );
});

PollContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PollContainer;
