import { useCallback, useEffect, useRef, useState } from 'react';

import { isiOS } from '../../../utils';
import { VOLUME_MAX, VOLUME_MIN } from '../../../constants';

const useFullscreen = ({
  isLive,
  isProfileExpanded,
  player,
  playerSectionRef,
  stopPropagAndResetTimeout
}) => {
  const [isFullscreenEnabled, setIsFullscreenEnabled] = useState(false);
  const {
    hasPlayedFinalBuffer,
    pause,
    play,
    playerRef,
    updateVolume,
    videoRef
  } = player;
  const iOsFullscreenIntervalId = useRef(null);

  const enterFullscreen = useCallback(async () => {
    /**
     * On iOS devices, the Fullscreen API isn't available.
     * We can only go fullscreen on the video element and use the default iOS controls.
     */
    if (isiOS() && videoRef?.current) {
      videoRef.current.webkitEnterFullscreen();
      setIsFullscreenEnabled(true);

      iOsFullscreenIntervalId.current = setInterval(() => {
        if (!videoRef.current?.webkitDisplayingFullscreen) {
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

    if (playerSectionRef.current.requestFullscreen) {
      await playerSectionRef.current.requestFullscreen();
    } else if (playerSectionRef.current.webkitRequestFullscreen) {
      /**
       * Safari specific behavior:
       * webkitRequestFullscreen needs to be called on the element directly and does not return a Promise
       */
      playerSectionRef.current.webkitRequestFullscreen();
    }
  }, [pause, play, playerRef, playerSectionRef, updateVolume, videoRef]);

  const exitFullscreen = useCallback(async () => {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen)
      /**
       * Safari specific behavior:
       * webkitExitFullscreen does not return a Promise
       */
      document.webkitExitFullscreen();
  }, []);

  const onClickFullscreenHandler = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);

      if (
        !playerSectionRef?.current ||
        isLive === undefined ||
        isProfileExpanded
      )
        return;

      try {
        if (isFullscreenEnabled) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      } catch (error) {
        // Unlikely, user has manually disabled fullscreen API
      }
    },
    [
      enterFullscreen,
      exitFullscreen,
      isFullscreenEnabled,
      isLive,
      isProfileExpanded,
      playerSectionRef,
      stopPropagAndResetTimeout
    ]
  );

  useEffect(() => {
    if (isFullscreenEnabled && hasPlayedFinalBuffer) {
      exitFullscreen();
    }
  }, [isFullscreenEnabled, hasPlayedFinalBuffer, exitFullscreen]);

  useEffect(() => {
    if (playerSectionRef?.current) {
      const currentPlayerElementRef = playerSectionRef.current;
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
  }, [playerSectionRef, setIsFullscreenEnabled]);

  return { isFullscreenEnabled, onClickFullscreenHandler };
};

export default useFullscreen;
