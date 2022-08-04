import { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import './Player.css';
import { NoSignal as NoSignalSvg } from '../../assets/icons';
import { player as $content } from '../../content';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import FullScreenLoader from '../FullScreenLoader';
import useControls from '../../hooks/useControls';
import usePlayer from '../../hooks/usePlayer';

const Player = ({ isLive, setIsLive, playbackUrl }) => {
  const { isDefaultResponsiveView } = useMobileBreakpoint();
  const { setIsHovered } = useControls();
  const livePlayer = usePlayer({ playbackUrl, isLive });
  const {
    hasFinalBuffer,
    hasEnded,
    isInitialLoading,
    isLoading,
    error,
    videoRef
  } = livePlayer;
  const hasError = !!error;

  useEffect(() => {
    if (hasEnded) {
      setIsLive(false);
    }
  }, [hasEnded, setIsLive]);

  const onMouseEnterHandler = useCallback(() => {
    setIsHovered(true);
  }, [setIsHovered]);

  const onMouseLeaveHandler = useCallback(() => {
    setIsHovered(false);
  }, [setIsHovered]);

  return (
    <>
      <section className="video-player-section">
        <div
          className="video-player-container"
          {...(!isDefaultResponsiveView
            ? {
                onMouseEnter: onMouseEnterHandler,
                onMouseLeave: onMouseLeaveHandler
              }
            : {})}
        >
          {isLive || isLive === undefined || hasFinalBuffer ? (
            <>
              {isLoading && !hasError && <FullScreenLoader />}
              {hasError && <div className="cover black-cover" />}
              <video
                id="player"
                {...(!isInitialLoading || hasError
                  ? { style: { background: 'var(--color-black)' } }
                  : {})}
                autoPlay
                muted
                playsInline
                ref={videoRef}
              />
            </>
          ) : (
            <div className="cover channel-offline-container">
              <div>
                <NoSignalSvg className="fill-lightMode-gray-medium dark:fill-darkMode-gray" />
                <h2 className="text-lightMode-gray-medium dark:text-darkMode-gray">
                  {$content.stream_offline}
                </h2>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* TEMP: the controls will be part of a subsequent PR */}
      {/* <FadeInOut
        className="player-controls-container"
        inProp={
          hasError || (isControlsOpen && (!isLoading || !isInitialLoading))
        }
        mountOnEnter
      >
        <Controls
          player={livePlayer}
          stopPropagAndResetTimeout={stopPropagAndResetTimeout}
        />
      </FadeInOut> */}
    </>
  );
};

Player.propTypes = {
  playbackUrl: PropTypes.string,
  isLive: PropTypes.bool,
  setIsLive: PropTypes.func.isRequired
};

Player.defaultProps = {
  isLive: undefined,
  playbackUrl: ''
};

export default Player;
