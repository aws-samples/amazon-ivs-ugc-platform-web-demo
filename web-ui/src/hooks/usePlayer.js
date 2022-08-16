import { useCallback, useEffect, useRef, useState } from 'react';
import usePlayerBlur from './usePlayerBlur';
import usePrevious from './usePrevious';
import { VOLUME_MAX } from '../constants';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(VOLUME_MAX);
  const [hasEnded, setHasEnded] = useState(false);
  const [hasPlayedFinalBuffer, setHasPlayedFinalBuffer] = useState(false);
  const [qualities, setQualities] = useState([{ name: 'Auto' }]);
  const [selectedQualityName, setSelectedQualityName] = useState(
    qualities[0].name
  );
  const [hasLoaded, setHasLoaded] = useState(false);
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

      setHasLoaded(true);
    }
    if (newState === BUFFERING) setIsLoading(true);
    if (newState === PLAYING) setIsLoading(false);
    if (newState !== ENDED) resetIntervalId();
    setError(null);
    setHasEnded(newState === ENDED);

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
    setIsPaused(false);
  }, []);
  const pause = useCallback(() => {
    resetIntervalId();
    setIsPaused(true);
    setIsLoading(false);
  }, [resetIntervalId]);
  const updateQuality = useCallback((name) => {
    setSelectedQualityName(name);
  }, []);
  const updateVolume = useCallback((newVolume) => {
    setVolumeLevel(newVolume);
  }, []);

  const load = useCallback(
    (playbackUrl) => {
      if (!playbackUrl) return;

      if (!playerRef.current) create();

      playerRef.current.load(playbackUrl);
      updateVolume(VOLUME_MAX);
    },
    [create, updateVolume]
  );
  const reset = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsPaused(false);
    setHasEnded(false);
    setVolumeLevel(VOLUME_MAX);
    setHasPlayedFinalBuffer(false);
    setQualities([{ name: 'Auto' }]);
    setHasLoaded(false);
    resetIntervalId();
    destroy();
  }, [destroy, resetIntervalId]);

  const { shouldBlurPlayer, isBlurReady, canvasRef } = usePlayerBlur({
    ingestConfiguration,
    isLive,
    isLoading,
    videoRef
  });

  /**
   * Users can use the controls while the player is loading.
   * We're always updating the player based on the local state.
   */
  // UPDATE PLAYER START
  useEffect(() => {
    if (!playerRef.current) return;

    // Resume or pause playback
    if (!isPaused && (!hasLoaded || hasError)) {
      setIsLoading(true);
      setError(null);
      playerRef.current.load(playbackUrl);
    } else if (!isPaused && playerRef.current.isPaused()) {
      playerRef.current.play();
    } else if (isPaused && !playerRef.current.isPaused()) {
      playerRef.current.pause();
    }

    // Update current quality
    const quality = qualities.find(
      (quality) => quality.name === selectedQualityName
    );

    if (quality) {
      if (
        selectedQualityName === 'Auto' &&
        !playerRef.current.isAutoQualityMode()
      )
        playerRef.current.setAutoQualityMode(true);
      else if (
        selectedQualityName !== 'Auto' &&
        playerRef.current.getQuality()?.name !== quality.name
      )
        playerRef.current.setQuality(quality);
    }

    // Update volume
    const ivsVolume = Number((volumeLevel / 100).toFixed(1));

    if (playerRef.current.isMuted()) playerRef.current.setMuted(false);
    if (playerRef.current.getVolume() !== ivsVolume)
      playerRef.current.setVolume(ivsVolume);
  }, [
    hasError,
    hasLoaded,
    isPaused,
    playbackUrl,
    qualities,
    selectedQualityName,
    volumeLevel
  ]);
  // UPDATE PLAYER END

  /**
   * Play the last buffer segment before closing the player
   */
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
    const loadPlayer = () => load(playbackUrl);

    if (playbackUrl && isLive) {
      loadPlayer();
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
    isLoading,
    isPaused,
    pause,
    play,
    playerRef,
    qualities,
    reset,
    selectedQualityName,
    setError,
    shouldBlurPlayer,
    updateQuality,
    updateVolume,
    videoRef,
    volumeLevel
  };
};

export default usePlayer;
