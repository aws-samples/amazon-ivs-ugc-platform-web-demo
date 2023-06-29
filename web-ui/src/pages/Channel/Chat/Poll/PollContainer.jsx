import { useEffect, useRef, forwardRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { useChannel } from '../../../../contexts/Channel';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useUser } from '../../../../contexts/User';
import useDebouncedCallback from '../../../../hooks/useDebouncedCallback';

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
    console.log('shouldRenderInTab >>>>', shouldRenderInTab)
    const marginBotttomRef = useRef();
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [height, setHeight] = useState();
    const fullHeightOfPoll = useRef();
    const { channelData } = useChannel();
    const {
      hasScrollbar,
      setHasScrollbar,
      isVoting,
      hasPollEnded,
      composerRefState
    } = usePoll();

    const { isTouchscreenDevice, isLandscape } = useResponsiveDevice();
    const { isSessionValid } = useUser();
    const { color } = channelData || {};
    const scrollableContentHeight =
      windowHeight -
      COMPOSER_HEIGHT_PX -
      SPACE_BETWEEN_POLL_AND_COMPOSER_PX -
      (isVoting ? FOOTER_HEIGHT_PX : FOOTER_HEIGHT_PX - VOTE_BUTTON_HEIGHT_PX);

    useEffect(() => {
      marginBotttomRef.current =
        isLandscape || !isSessionValid ? 'mb-28' : 'mb-0';
    }, [isTouchscreenDevice, isLandscape, isSessionValid]);

    const debouncedSetWindowHeight = useDebouncedCallback(() => {
      if (isViewer) {
        setWindowHeight(window.innerHeight);
      }
    }, 200);

    useEffect(() => {
      if (isViewer) {
        setWindowHeight(window.innerHeight);

        window.addEventListener('resize', debouncedSetWindowHeight);

        return () => {
          window.removeEventListener('resize', debouncedSetWindowHeight);
        };
      }
    }, [debouncedSetWindowHeight, isViewer]);


    useEffect(() => {
      const onResizeUpdatePollHeight = () => {
        const pollComponent = ref.current;
        const composerComponent = composerRefState.current;
        const poll = pollComponent?.getBoundingClientRect();
        const composer = composerComponent?.getBoundingClientRect();
        if (pollComponent && composerComponent) {
          const distanceY =
            poll?.bottom -
            composer?.top +
            (hasScrollbar ? FOOTER_HEIGHT_PX : 0);
          const isDecreasingBrowserHeight =
            distanceY > -SPACE_BETWEEN_POLL_AND_COMPOSER_PX;

          if (isDecreasingBrowserHeight && !hasPollEnded) {
            setHeight(scrollableContentHeight);
            setHasScrollbar(true);
          } else {
            if (height === '100%' && !hasPollEnded) {
              return;
            }

            if (hasPollEnded) {
              const updatedPollHeight =
                windowHeight -
                COMPOSER_HEIGHT_PX -
                SPACE_BETWEEN_POLL_AND_COMPOSER_PX;

              if (updatedPollHeight > ref.current.scrollHeight) {
                setHasScrollbar(false);
                setHeight('100%');
              } else {
                setHasScrollbar(true);
                setHeight(updatedPollHeight);
              }
            } else {
              const shouldSetFullHeight =
                fullHeightOfPoll.current < scrollableContentHeight ||
                Math.abs(distanceY) + scrollableContentHeight >
                  ref.current.scrollHeight;
              setHasScrollbar(!shouldSetFullHeight);
              setHeight(shouldSetFullHeight ? '100%' : scrollableContentHeight);
            }
          }
        }
      };

      if (fullHeightOfPoll.current) {
        onResizeUpdatePollHeight();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [windowHeight, isVoting, hasPollEnded]);

    useEffect(() => {
      const onMount = () => {
        fullHeightOfPoll.current = ref.current.scrollHeight;

        const pollComponent = ref.current;
        const composerComponent = composerRefState.current;
        const poll = pollComponent?.getBoundingClientRect();
        const composer = composerComponent?.getBoundingClientRect();

        if (pollComponent && composerComponent) {
          const overlapY =
            poll?.bottom > composer?.top && poll?.top < composer?.bottom;
          const distanceY = Math.abs(poll?.bottom - composer?.top);

          // Add a scroll bar if the components are overlapping or < 20px apart
          const shouldAddScrollBar =
            overlapY || distanceY < SPACE_BETWEEN_POLL_AND_COMPOSER_PX;

          setHeight(shouldAddScrollBar ? scrollableContentHeight : '100%');
          setHasScrollbar(shouldAddScrollBar);
        }
      };

      if (!fullHeightOfPoll.current) {
        onMount();
      }
    }, [
      composerRefState,
      isVoting,
      ref,
      scrollableContentHeight,
      setHasScrollbar,
      windowHeight
    ]);

    return (
      <div
        style={{
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
