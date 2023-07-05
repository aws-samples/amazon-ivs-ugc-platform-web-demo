import { useEffect, useRef, forwardRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { useChannel } from '../../../../contexts/Channel';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useUser } from '../../../../contexts/User';
import useDebouncedCallback from '../../../../hooks/useDebouncedCallback';
import useResize from '../../../../hooks/useResize';

// Static heights based on design
const COMPOSER_HEIGHT_PX = 92;
const VOTE_BUTTON_HEIGHT_PX = 60;
const PROGRESS_BAR_HEIGHT_PX = 26;
const FOOTER_PADDING_HEIGHT_PX = 20;
const FOOTER_HEIGHT_PX =
  VOTE_BUTTON_HEIGHT_PX + PROGRESS_BAR_HEIGHT_PX + FOOTER_PADDING_HEIGHT_PX;
const SPACE_BETWEEN_POLL_AND_COMPOSER_PX = 20;

const PollContainer = forwardRef(
  ({ children, isViewer, shouldRenderInTab }, ref) => {
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

    const { isTouchscreenDevice, isLandscape } = useResponsiveDevice();
    const { isSessionValid } = useUser();
    const { color } = channelData || {};
    let previousHeight = window.innerHeight;

    const getScrollableContentHeight = (
      windowHeight,
      hasPollEnded,
      isVoting
    ) => {
      if (hasPollEnded)
        return (
          windowHeight - COMPOSER_HEIGHT_PX - SPACE_BETWEEN_POLL_AND_COMPOSER_PX
        );

      return (
        windowHeight -
        COMPOSER_HEIGHT_PX -
        SPACE_BETWEEN_POLL_AND_COMPOSER_PX -
        (isVoting
          ? FOOTER_HEIGHT_PX
          : PROGRESS_BAR_HEIGHT_PX + FOOTER_PADDING_HEIGHT_PX)
      );
    };

    useEffect(() => {
      marginBotttomRef.current =
        isLandscape || !isSessionValid ? 'mb-28' : 'mb-0';
    }, [isTouchscreenDevice, isLandscape, isSessionValid]);

    useEffect(() => {
      // Recalculate the height of the poll if user has voted or the poll has ended
      if (fullHeightOfPoll.current && (!isVoting || hasPollEnded)) {
        const pollComponent = ref.current;
        const composerComponent = composerRefState.current;
        const poll = pollComponent?.getBoundingClientRect();
        const composer = composerComponent?.getBoundingClientRect();
        const distanceY =
          poll?.bottom - composer?.top + (hasScrollbar ? FOOTER_HEIGHT_PX : 0);

        const scrollableContentHeight = getScrollableContentHeight(
          window.innerHeight,
          hasPollEnded,
          isVoting
        );

        if (hasPollEnded) {
          if (scrollableContentHeight > ref.current.scrollHeight) {
            dispatchPollState({ hasScrollbar: false });
            setHeight('100%');
          } else {
            dispatchPollState({ hasScrollbar: true });
            setHeight(scrollableContentHeight);
          }
        } else {
          const shouldSetFullHeight =
            fullHeightOfPoll.current < scrollableContentHeight ||
            Math.abs(distanceY) + scrollableContentHeight >
              ref.current.scrollHeight;
          dispatchPollState({ hasScrollbar: !shouldSetFullHeight });
          setHeight(shouldSetFullHeight ? '100%' : scrollableContentHeight);
        }
      }
    }, [hasPollEnded, isVoting]);

    useResize(
      useDebouncedCallback(() => {
        const windowHeight = window.innerHeight;
        const pollComponent = ref.current;
        const composerComponent = composerRefState.current;
        // Compare the distance between the poll and composer component

        if (pollComponent && composerComponent) {
          const poll = pollComponent?.getBoundingClientRect();
          const composer = composerComponent?.getBoundingClientRect();
          const scrollableContentHeight = getScrollableContentHeight(
            windowHeight,
            hasPollEnded,
            isVoting
          );

          if (!fullHeightOfPoll.current) {
            // Mounting
            fullHeightOfPoll.current = ref.current.scrollHeight;

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
            
            const pollComponent = ref.current;
            const composerComponent = composerRefState.current;

            if (pollComponent && composerComponent) {
              const poll = pollComponent?.getBoundingClientRect();
              const composer = composerComponent?.getBoundingClientRect();
  
              const distanceY =
                poll?.bottom -
                composer?.top +
                (hasScrollbar ? FOOTER_HEIGHT_PX : 0);
  
              // Decrease browser size
              if (windowHeight < previousHeight) {
                if (distanceY > -20) {
                  setHeight(scrollableContentHeight);
                  dispatchPollState({ hasScrollbar: true });
                }
              } else {
                // Increase browser size
                // Check if we can go from the poll footer design back to the expanded design
                if (
                  scrollableContentHeight +
                    (isVoting
                      ? FOOTER_HEIGHT_PX
                      : PROGRESS_BAR_HEIGHT_PX + FOOTER_PADDING_HEIGHT_PX) >
                  fullHeightOfPoll.current
                ) {
                  setHeight('100%');
                  dispatchPollState({ hasScrollbar: false });
                } else {
                  setHeight(scrollableContentHeight);
                  dispatchPollState({ hasScrollbar: true });
                }
              }
  
              previousHeight = windowHeight;
            }
          }
        }
      }, 200),
      { shouldCallOnMount: true }
    );

    return (
      <div
        className={clsm([
          'overflow-hidden',
          'rounded-xl',
          'm-5',
          !shouldRenderInTab &&
            isViewer &&
            hasScrollbar &&
            !hasPollEnded && ['mb-0', 'rounded-b-none']
        ])}
      >
        <div
          style={{
            height: !shouldRenderInTab && isViewer && height
          }}
          ref={ref}
          className={clsm([
            !shouldRenderInTab &&
              isViewer &&
              hasScrollbar &&
              'overflow-y-scroll',
            'p-5',
            hasPollEnded && 'pb-7',
            `bg-profile-${color}`,
            shouldRenderInTab !== false && `${marginBotttomRef.current}`,
            `scrollbar-color-poll-${color}-scrollBarThumb`
          ])}
        >
          {children}
        </div>
      </div>
    );
  }
);

PollContainer.defaultProps = {
  shouldRenderInTab: false
};

PollContainer.propTypes = {
  children: PropTypes.node.isRequired,
  isViewer: PropTypes.bool.isRequired,
  shouldRenderInTab: PropTypes.bool
};

export default PollContainer;
