import { useCallback, useEffect, useRef, useState } from 'react';
import usePlayerBlur from './usePlayerBlur';
import usePrevious from './usePrevious';

const { IVSPlayer } = window;
const {
  create: createMediaPlayer,
  isPlayerSupported,
  PlayerEventType,
  PlayerState
} = IVSPlayer;
const { ENDED, PLAYING, READY, BUFFERING } = PlayerState;
const { ERROR } = PlayerEventType;

const usePlayer = ({ isLive, playbackUrl, ingestConfiguration }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const timeoutId = useRef();
  const prevIsChannelLive = usePrevious(isLive);
  const [error, setError] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasPlayedFinalBuffer, setHasPlayedFinalBuffer] = useState(false);
  const [qualities, setQualities] = useState([{ name: 'Auto' }]);
  const [selectedQualityName, setSelectedQualityName] = useState(
    qualities[0].name
  );
  const hasError = !!error;
  const intervalId = useRef(null);

  const resetIntervalId = useCallback(() => {
    clearInterval(intervalId.current);
    intervalId.current = null;
  }, []);

  // Generic PlayerState event listener
  const onStateChange = useCallback(() => {
    if (!playerRef.current) return;

    const newState = playerRef.current.getState();

    if (newState === READY) {
      // Getting the qualities does not work on iOS, hence the fallback
      const qualities = playerRef.current.getQualities() || [];

      setQualities((prevQualities) =>
        qualities.some(
          (quality) =>
            !prevQualities.find(
              (prevQuality) => prevQuality.name === quality.name
            )
        )
          ? [{ name: 'Auto' }, ...qualities]
          : prevQualities
      );
    }
    if (newState === PLAYING) setIsInitialLoading(false);
    if (newState !== ENDED) resetIntervalId();

    setError(null);
    setHasEnded(newState === ENDED);
    setIsLoading(newState === READY || newState === BUFFERING);
    setIsPaused(playerRef.current?.isPaused() || false);

    console.log(`Player State - ${newState}`);
  }, [resetIntervalId]);

  // Generic PlayerEventType event listener
  const onError = useCallback((err) => {
    console.warn(`Player Event - ERROR:`, err, playerRef.current);

    setError(err);
    setIsLoading(false);
    setIsPaused(true);
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

  const play = useCallback(() => {
    if (!playerRef.current) return;

    if (hasError) {
      setIsLoading(true);
      playerRef.current.load(playbackUrl);
    }

    if (playerRef.current.isPaused()) {
      playerRef.current.play();
      setIsPaused(false);
    }
  }, [hasError, playbackUrl]);

  const pause = useCallback(() => {
    if (!playerRef.current) return;

    if (!playerRef.current.isPaused()) {
      playerRef.current.pause();
      setIsPaused(true);
    }
  }, []);
  const mute = useCallback(() => {
    if (!playerRef.current) return;

    if (!playerRef.current.isMuted()) {
      playerRef.current.setMuted(true);
      setIsMuted(true);
    }
  }, []);
  const unmute = useCallback(() => {
    if (!playerRef.current) return;

    if (playerRef.current.isMuted()) {
      playerRef.current.setMuted(false);
      setIsMuted(false);
    }
  }, []);

  const load = useCallback(
    (playbackUrl) => {
      if (!playbackUrl) return;

      if (!playerRef.current) create();

      playerRef.current.load(playbackUrl);
      play();
    },
    [create, play]
  );
  const reset = useCallback(() => {
    setIsInitialLoading(true);
    setIsLoading(true);
    setIsPaused(true);
    setIsMuted(true);
    setHasEnded(false);
    setHasPlayedFinalBuffer(false);
    setQualities([{ name: 'Auto' }]);
    resetIntervalId();
    destroy();
  }, [destroy, resetIntervalId]);

  const updateQuality = useCallback(
    (name) => {
      if (!playerRef.current) return;

      const quality = qualities.find((quality) => quality.name === name);

      if (quality) {
        if (name === 'Auto') playerRef.current.setAutoQualityMode();
        else playerRef.current.setQuality(quality);

        setSelectedQualityName(name);
      }
    },
    [qualities]
  );

  const { shouldBlurPlayer, isBlurReady, canvasRef } = usePlayerBlur({
    ingestConfiguration,
    isLive,
    isLoading,
    videoRef
  });

  useEffect(() => {
    if (prevIsChannelLive && !isLive && playerRef.current) {
      let bufferDuration = playerRef.current.getBufferDuration();

      if (bufferDuration < 0) bufferDuration = 0;

      timeoutId.current = setTimeout(
        () => setHasPlayedFinalBuffer(true),
        bufferDuration * 1000
      );
    }

    return () => clearTimeout(timeoutId.current);
  }, [isLive, prevIsChannelLive]);

  useEffect(() => {
    if (hasError) reset();
  }, [hasError, reset]);

  useEffect(() => {
    const loadPlayer = () => load(playbackUrl);

    if (playbackUrl && isLive) {
      intervalId.current = setInterval(loadPlayer, 3000);
    } else if ((!playbackUrl || !isLive) && hasPlayedFinalBuffer) reset();

    return reset;
  }, [hasPlayedFinalBuffer, isLive, load, reset, playbackUrl]);

  return {
    canvasRef,
    error,
    hasEnded,
    hasFinalBuffer: prevIsChannelLive && !hasPlayedFinalBuffer,
    instance: playerRef.current,
    isBlurReady,
    isInitialLoading,
    isLoading,
    isMuted,
    isPaused,
    mute,
    pause,
    play,
    playerRef,
    qualities,
    reset,
    selectedQualityName,
    setError,
    shouldBlurPlayer,
    unmute,
    updateQuality,
    videoRef
  };
};

export default usePlayer;
