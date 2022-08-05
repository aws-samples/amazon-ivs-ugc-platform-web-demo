import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { NoSignal as NoSignalSvg } from '../../assets/icons';
import { player as $content } from '../../content';
import Controls from './Controls';
import FadeInOut from './FadeInOut';
import FullScreenLoader from '../FullScreenLoader';
import useControls from './Controls/useControls';
import usePlayer from '../../hooks/usePlayer';

const Player = ({ isLive, setIsLive, playbackUrl }) => {
  const {
    controlsContainerRef,
    isControlsOpen,
    onMouseEnterHandler,
    onMouseLeaveHandler,
    stopPropagAndResetTimeout
  } = useControls();
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

  const shouldShowLoader = isLoading && !hasError;

  return (
    <>
      <section className="flex justify-center items-center flex-col w-full h-screen">
        <div
          className="w-full h-full relative z-10"
          onMouseEnter={onMouseEnterHandler}
          onMouseLeave={onMouseLeaveHandler}
        >
          {isLive || isLive === undefined || hasFinalBuffer ? (
            <>
              {shouldShowLoader && <FullScreenLoader />}
              <div
                className="w-full absolute h-full max-h-[calc(100vh_-_112px)] md:max-h-screen"
                ref={controlsContainerRef}
              >
                <video
                  autoPlay
                  className={`w-full h-full ${
                    shouldShowLoader ? 'hidden' : 'block'
                  }`}
                  muted
                  playsInline
                  ref={videoRef}
                />
                <FadeInOut
                  className="player-controls-container flex items-end h-32 px-8 pt-0 pb-8 absolute bottom-0 left-0 w-full z-20"
                  inProp={
                    hasError ||
                    (isControlsOpen && (!isLoading || !isInitialLoading))
                  }
                  mountOnEnter
                >
                  <Controls
                    player={livePlayer}
                    stopPropagAndResetTimeout={stopPropagAndResetTimeout}
                  />
                </FadeInOut>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center absolute w-full h-full z-10 bottom-0 left-0">
              <div className="flex items-center flex-col gap-y-2">
                <NoSignalSvg className="fill-lightMode-gray-medium dark:fill-darkMode-gray" />
                <h2 className="text-lightMode-gray-medium dark:text-darkMode-gray">
                  {$content.stream_offline}
                </h2>
              </div>
            </div>
          )}
        </div>
      </section>
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
