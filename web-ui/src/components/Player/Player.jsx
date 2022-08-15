import { AnimatePresence, m } from 'framer-motion';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { NoSignal as NoSignalSvg } from '../../assets/icons';
import { player as $content } from '../../content';
import Controls from './Controls';
import FullScreenLoader from '../FullScreenLoader';
import useControls from './Controls/useControls';
import usePlayer from '../../hooks/usePlayer';

const Player = ({ isLive, setIsLive, playbackUrl }) => {
  const livePlayer = usePlayer({ playbackUrl, isLive });
  const {
    error,
    hasEnded,
    hasFinalBuffer,
    isInitialLoading,
    isLoading,
    isPaused,
    selectedQualityName,
    videoRef
  } = livePlayer;
  const {
    isControlsOpen,
    mobileClickHandler,
    onMouseMoveHandler,
    onControlHoverHandler,
    setIsPopupOpen,
    stopPropagAndResetTimeout
  } = useControls(isPaused);
  const hasError = !!error;
  const shouldShowLoader = isLoading && !hasError;
  const shouldShowControls =
    hasError || (isControlsOpen && (!isLoading || !isInitialLoading));

  useEffect(() => {
    if (hasEnded) {
      setIsLive(false);
    }
  }, [hasEnded, setIsLive]);

  return (
    <section className="flex justify-center items-center flex-col w-full h-screen">
      <div className="w-full h-full relative" onMouseMove={onMouseMoveHandler}>
        {isLive || isLive === undefined || hasFinalBuffer ? (
          <>
            {shouldShowLoader && <FullScreenLoader />}
            <div
              className={clsm([
                'absolute',
                'h-full',
                'portrait:md:max-h-[calc(calc(var(--mobile-vh,1vh)_*_100)_-_112px)]',
                'max-h-screen',
                'top-0',
                'w-full'
              ])}
              id="player-controls-container"
              onPointerDown={mobileClickHandler}
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
              <AnimatePresence>
                {shouldShowControls && (
                  <m.div
                    animate="visible"
                    initial="hidden"
                    exit="hidden"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 }
                    }}
                    className={clsm([
                      'player-controls-container',
                      'flex',
                      'items-end',
                      'h-32',
                      'px-8',
                      'pt-0',
                      'pb-8',
                      'absolute',
                      'bottom-0',
                      'left-0',
                      'w-full',
                      'z-20'
                    ])}
                    transition={{ duration: 0.25, type: 'tween' }}
                  >
                    <Controls
                      onControlHoverHandler={onControlHoverHandler}
                      player={livePlayer}
                      selectedQualityName={selectedQualityName}
                      setIsPopupOpen={setIsPopupOpen}
                      stopPropagAndResetTimeout={stopPropagAndResetTimeout}
                    />
                  </m.div>
                )}
              </AnimatePresence>
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
