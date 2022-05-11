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

const usePlayer = ({ setIsLive, playbackUrl }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const isReady = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  // Generic PlayerState event listener
  const onStateChange = useCallback(() => {
    const newState = playerRef.current.getState();

    console.log(`Player State - ${newState}`);

    if (newState === READY) {
      isReady.current = true;
      setIsLive(true);
    } else if (newState === ENDED) {
      isReady.current = false;
      setIsLive(false);
    }

    setIsLoading(newState !== PLAYING);
  }, [setIsLive]);

  // Generic PlayerEventType event listener
  const onError = useCallback(
    (err) => {
      console.warn(`Player Event - ERROR:`, err, playerRef.current);

      isReady.current = false;
      setIsLive(false);
    },
    [setIsLive]
  );

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

  const play = useCallback(() => {
    if (!playerRef.current) return;

    if (playerRef.current.isPaused()) {
      playerRef.current.play();
    }
  }, []);

  const load = useCallback(
    (playbackUrl) => {
      if (!playerRef.current) create();
      if (!isReady.current) {
        playerRef.current.load(playbackUrl);
        play();
      }
    },
    [create, play]
  );

  useEffect(() => {
    const retryPlayer = () => {
      load(playbackUrl);
    };
    let intervalId;

    if (playbackUrl) {
      retryPlayer();
      intervalId = setInterval(retryPlayer, 5000);

      return () => {
        destroy();
        clearInterval(intervalId);
      };
    }
  }, [destroy, load, playbackUrl]);

  return { isLoading, videoRef };
};

export default usePlayer;
