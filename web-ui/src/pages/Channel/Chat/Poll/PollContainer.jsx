import { forwardRef, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { useChannel } from '../../../../contexts/Channel';
import useResizeObserver from '../../../../hooks/useResizeObserver';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useUser } from '../../../../contexts/User';
import useDebouncedCallback from '../../../../hooks/useDebouncedCallback';

const PollContainer = forwardRef(({ children, isViewer }, ref) => {
  const marginBotttomRef = useRef();
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const [currentPollHeight, setCurrentPollHeight] = useState(0)
  const { channelData } = useChannel();
  const { showFinalResults, setMinifiedDesign, minifiedDesign } = usePoll();
  const { isTouchscreenDevice, isLandscape } = useResponsiveDevice();
  const { isSessionValid } = useUser();
  const { color } = channelData || {};

  useEffect(() => {
    marginBotttomRef.current =
      isLandscape || !isSessionValid ? 'mb-28' : 'mb-0';
  }, [isTouchscreenDevice, isLandscape, isSessionValid]);

  const handleResize = () => {
    if (isViewer) setWindowHeight(window.innerHeight)
  }

  const debouncedHandleResize = useDebouncedCallback(
    handleResize,
    300
  );

  const getHeight = () => {
      if (isViewer) {
        const COMPOSER_HEIGHT = 92
        const minifiedHeight = windowHeight - COMPOSER_HEIGHT - 20
        return minifiedHeight > currentPollHeight
          ? '100%'
          : minifiedHeight;
      }
      return '100%'
  };

  useResizeObserver(
    ref,
    (entry) => {
      if (entry) {
        const { height: updatedHeight } = entry.target.getBoundingClientRect()
        if (!currentPollHeight || currentPollHeight !== updatedHeight) {
          // mount
          if (windowHeight - 92 - 20 > updatedHeight) {
            console.log('SHOW MINIFIED DESIGN')
          } else {
            console.log('SHOW 100%')
          }
          setCurrentPollHeight(updatedHeight)
        }
      }
    },
    isViewer
  );

  useEffect(() => {
    if (isViewer) {
      setWindowHeight(window.innerHeight)

      window.addEventListener('resize', debouncedHandleResize);
  
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return (
    <div
      ref={ref}
      style={{ height: getHeight(), overflowY: 'scroll' }}
      className={clsm([
        'm-5',
        'p-5',
        showFinalResults && 'pb-7',
        `bg-profile-${color}`,
        'rounded-xl',
        `${marginBotttomRef.current}`
      ])}
    >
      {children}
    </div>
  );
})

PollContainer.propTypes = {
  children: PropTypes.node.isRequired
};

export default PollContainer;
