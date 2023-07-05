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

    useEffect(() => {
      marginBotttomRef.current =
        isLandscape || !isSessionValid ? 'mb-28' : 'mb-0';
    }, [isTouchscreenDevice, isLandscape, isSessionValid]);

    useEffect(() => {
      // Recalculate the height of the poll if user has voted or the poll has ended
      if (!isVoting || hasPollEnded) {
        const pollComponent = ref.current;
        const composerComponent = composerRefState.current;
        const poll = pollComponent?.getBoundingClientRect();
        const composer = composerComponent?.getBoundingClientRect();
        const distanceY =
          poll?.bottom - composer?.top + (hasScrollbar ? FOOTER_HEIGHT_PX : 0);

        const scrollableContentHeight =
          window.innerHeight -
          COMPOSER_HEIGHT_PX -
          SPACE_BETWEEN_POLL_AND_COMPOSER_PX -
          (isVoting
            ? FOOTER_HEIGHT_PX
            : FOOTER_HEIGHT_PX - VOTE_BUTTON_HEIGHT_PX);

        if (hasPollEnded) {
          const updatedPollHeight =
            window.innerHeight -
            COMPOSER_HEIGHT_PX -
            SPACE_BETWEEN_POLL_AND_COMPOSER_PX;

          if (updatedPollHeight > ref.current.scrollHeight) {
            dispatchPollState({ hasScrollbar: false });
            setHeight('100%');
          } else {
            dispatchPollState({ hasScrollbar: true });
            setHeight(updatedPollHeight);
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

        // Compare the distance between the poll and composer component
        const pollComponent = ref?.current;
        const composerComponent = composerRefState?.current;

        if (pollComponent && composerComponent) {
          const poll = pollComponent?.getBoundingClientRect();
          const composer = composerComponent?.getBoundingClientRect();
          const scrollableContentHeight =
            windowHeight -
            COMPOSER_HEIGHT_PX -
            SPACE_BETWEEN_POLL_AND_COMPOSER_PX -
            FOOTER_HEIGHT_PX;

          if (!fullHeightOfPoll.current) {
            // Mounting
            fullHeightOfPoll.current = ref.current.scrollHeight;

            const overlapY =
              poll.bottom > composer?.top && poll?.top < composer?.bottom;
            const distanceY = Math.abs(poll?.bottom - composer?.top);
            const shouldAddScrollBar = overlapY || distanceY < 20;

            if (shouldAddScrollBar) {
              setHeight(scrollableContentHeight);
              // setHasScrollbar(true);
              dispatchPollState({ hasScrollbar: true });
            }
          } else {
            // Resizing
            const distanceY =
              poll?.bottom -
              composer?.top +
              (hasScrollbar ? FOOTER_HEIGHT_PX : 0);

            if (distanceY > -20) {
              // Decrease size of browser
              setHeight(scrollableContentHeight);
              dispatchPollState({ hasScrollbar: true });
            } else {
              // Increase size of browser
              // Check if we can go from the poll footer design back to the expanded design
              if (scrollableContentHeight > fullHeightOfPoll.current) {
                setHeight('100%');
                dispatchPollState({ hasScrollbar: false });
              } else {
                setHeight(scrollableContentHeight);
                dispatchPollState({ hasScrollbar: true });
              }
            }
          }
        }
      }, 200),
      { shouldCallOnMount: true }
    );

    return (
      <div
        style={{
          border: '1px solid red',
          height: !shouldRenderInTab && isViewer && height
        }}
        ref={ref}
        className={clsm([
          !shouldRenderInTab && 'overflow-y-scroll',
          'm-5',
          'p-5',
          hasPollEnded && 'pb-7',
          `bg-profile-${color}`,
          'rounded-xl',
          shouldRenderInTab !== false && `${marginBotttomRef.current}`,
          !shouldRenderInTab &&
            isViewer &&
            hasScrollbar &&
            !hasPollEnded && ['mb-0', 'rounded-b-none']
        ])}
      >
        {children}
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
