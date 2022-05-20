import { useCallback, useEffect, useRef, useState } from 'react';

const { IVSPlayer } = window;
const {
  create: createMediaPlayer,
  isPlayerSupported,
  PlayerEventType,
  PlayerState
} = IVSPlayer;
const { ENDED, PLAYING, READY, BUFFERING } = PlayerState;
const { ERROR } = PlayerEventType;

const usePlayer = ({ isLive, playbackUrl }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const intervalId = useRef(null);
  const resetIntervalId = useCallback(() => {
    clearInterval(intervalId.current);
    intervalId.current = null;
  }, []);

  // Generic PlayerState event listener
  const onStateChange = useCallback(() => {
    const newState = playerRef.current.getState();

    console.log(`Player State - ${newState}`);

    if (newState !== ENDED) resetIntervalId();

    setIsLoading(newState !== PLAYING);
  }, [resetIntervalId]);

  // Generic PlayerEventType event listener
  const onError = useCallback((err) => {
    console.warn(`Player Event - ERROR:`, err, playerRef.current);
  }, []);

  const destroy = useCallback(() => {
    if (!playerRef.current) return;

    // remove event listeners
    playerRef.current.removeEventListener(READY, onStateChange);
    playerRef.current.removeEventListener(PLAYING, onStateChange);
    playerRef.current.removeEventListener(BUFFERING, onStateChange);
    playerRef.current.removeEventListener(ENDED, onStateChange);
    playerRef.current.removeEventListener(ERROR, onError);

    // delete and nullify player
    playerRef.current.pause();
    playerRef.current.delete();
    playerRef.current = null;
    videoRef.current?.removeAttribute('src'); // remove possible stale src
  }, [onError, onStateChange]);

  const create = useCallback(() => {
    if (!isPlayerSupported) {
      console.warn(
        'The current browser does not support the Amazon IVS player.'
      );

      return;
    }

    // If a player instance already exists, destroy it before creating a new one
    if (playerRef.current) destroy();

    playerRef.current = createMediaPlayer();
    playerRef.current.attachHTMLVideoElement(videoRef.current);

    playerRef.current.addEventListener(READY, onStateChange);
    playerRef.current.addEventListener(PLAYING, onStateChange);
    playerRef.current.addEventListener(BUFFERING, onStateChange);
    playerRef.current.addEventListener(ENDED, onStateChange);
    playerRef.current.addEventListener(ERROR, onError);
  }, [destroy, onError, onStateChange]);

  const load = useCallback(
    (playbackUrl) => {
      if (!playerRef.current) create();

      playerRef.current.setAutoplay(true);
      playerRef.current.load(playbackUrl);
    },
    [create]
  );

  useEffect(() => {
    const retryPlayer = () => load(playbackUrl);

    if (playbackUrl && isLive) {
      intervalId.current = setInterval(retryPlayer, 1000);

      return () => {
        destroy();
        resetIntervalId();
        setIsLoading(true);
      };
    }
  }, [destroy, isLive, load, playbackUrl, resetIntervalId]);

  return { isLoading, playerRef, videoRef };
};

export default usePlayer;
