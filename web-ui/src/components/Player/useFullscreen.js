import { useCallback, useEffect, useRef } from 'react';

import { isiOS } from '../../utils';
import { VOLUME_MAX, VOLUME_MIN } from '../../constants';

const useFullscreen = ({
  isFullscreenEnabled,
  player,
  playerElementRef,
  setIsFullscreenEnabled,
  stopPropagAndResetTimeout
}) => {
  const { pause, play, playerRef, updateVolume, videoRef } = player;
  const iOsFullscreenIntervalId = useRef(null);

  const onClickFullscreenHandler = useCallback(
    async (event) => {
      stopPropagAndResetTimeout(event);

      if (!playerElementRef?.current) return;

      /**
       * On iOS devices, the Fullscreen API isn't available.
       * We can only go fullscreen on the video element and use the default iOS controls.
       */
      if (isiOS() && videoRef?.current) {
        videoRef.current.webkitEnterFullscreen();
        setIsFullscreenEnabled(true);

        iOsFullscreenIntervalId.current = setInterval(() => {
          if (!videoRef?.current?.webkitDisplayingFullscreen) {
            clearInterval(iOsFullscreenIntervalId.current);
            iOsFullscreenIntervalId.current = null;

            setIsFullscreenEnabled(false);

            /**
             * Because we can't use the custom controls while in fullscreen mode,
             * we have to update the React state when exiting fullscreen mode.
             */
            if (playerRef.current.isPaused()) pause();
            else play();

            // iOS only supports mute/unmute so the volume is always 100 or 0 after exiting fullscreen mode
            if (playerRef.current.isMuted()) updateVolume(VOLUME_MIN);
            else updateVolume(VOLUME_MAX);
          }
        }, 100);

        return;
      }

      try {
        if (!isFullscreenEnabled) {
          if (playerElementRef.current.requestFullscreen)
            await playerElementRef.current.requestFullscreen();
          /**
           * Safari specific behavior:
           * webkitRequestFullscreen needs to be called on the element directly and does not return a Promise
           */ else if (playerElementRef.current.webkitRequestFullscreen)
            playerElementRef.current.webkitRequestFullscreen();
        } else {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen)
            /**
             * Safari specific behavior:
             * webkitExitFullscreen does not return a Promise
             */
            document.webkitExitFullscreen();
        }
      } catch (error) {
        // Unlikely, user has manually disabled fullscreen API
      }
    },
    [
      isFullscreenEnabled,
      pause,
      play,
      playerElementRef,
      playerRef,
      setIsFullscreenEnabled,
      stopPropagAndResetTimeout,
      updateVolume,
      videoRef
    ]
  );

  useEffect(() => {
    if (playerElementRef?.current) {
      const currentPlayerElementRef = playerElementRef.current;
      /**
       * Because Safari doesn't return a Promise after completing webkitRequestFullscreen or webkitExitFullscreen,
       * we set isFullscreenEnabled on fullscreenchange event instead.
       * The same logic is implemented here for other browsers for consistency.
       */
      const onFullscreenChange = () =>
        setIsFullscreenEnabled(
          !!(document.fullscreenElement || document.webkitFullscreenElement)
        );

      currentPlayerElementRef.addEventListener(
        'fullscreenchange',
        onFullscreenChange
      );
      currentPlayerElementRef.addEventListener(
        'webkitfullscreenchange',
        onFullscreenChange
      );

      return () => {
        currentPlayerElementRef.removeEventListener(
          'fullscreenchange',
          onFullscreenChange
        );
        currentPlayerElementRef.removeEventListener(
          'webkitfullscreenchange',
          onFullscreenChange
        );
      };
    }
  }, [playerElementRef, setIsFullscreenEnabled]);

  return { onClickFullscreenHandler };
};

export default useFullscreen;
