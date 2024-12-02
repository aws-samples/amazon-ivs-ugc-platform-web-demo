import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { noop } from '../utils';
import { unpack } from '../helpers/streamActionHelpers';
import { VOLUME_MAX, VOLUME_MIN } from '../constants';
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
const { ERROR, AUDIO_BLOCKED, TEXT_METADATA_CUE } = PlayerEventType;

const usePlayer = ({
  isLive,
  playbackUrl,
  ingestConfiguration,
  isBlurEnabled = false,
  defaultVolumeLevel = VOLUME_MAX,
  onTimedMetadataHandler = noop
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const timeoutId = useRef();
  const prevIsChannelLive = usePrevious(isLive);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(defaultVolumeLevel);
  const [hasPlayedFinalBuffer, setHasPlayedFinalBuffer] = useState();
  const [qualities, setQualities] = useState([{ name: 'Auto' }]);
  const [selectedQualityName, setSelectedQualityName] = useState(
    qualities[0].name
  );
  const [hasLoaded, setHasLoaded] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16 / 9);
  const hasError = !!error;
  const intervalId = useRef(null);

  const resetIntervalId = useCallback(() => {
    clearInterval(intervalId.current);
    intervalId.current = null;
  }, []);

  // Sets Volume to muted state if audio is blocked
  const onAudioBlocked = useCallback(() => {
    setVolumeLevel(VOLUME_MIN);
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
      setHasPlayedFinalBuffer(false);
    }
    if (newState === BUFFERING) setIsLoading(true);
    if (newState === PLAYING) setIsLoading(false);
    if (newState !== ENDED) resetIntervalId();
    setError(null);

    console.log(`Player State - ${newState}`);
  }, [resetIntervalId]);

  // Generic PlayerEventType event listener
  const onError = useCallback((err) => {
    console.warn('Player Event - ERROR:', err, playerRef.current);

    setError(err);
    setIsLoading(false);
    setIsPaused(true);
  }, []);

  // Timed metadata event listener
  const onTimedMetadata = useCallback(
    (cue) => {
      const metadata = unpack(cue.text);

      onTimedMetadataHandler({ ...metadata, startTime: Date.now() });

      console.info(`Timed metadata: ${metadata}`);
    },
    [onTimedMetadataHandler]
  );

  const destroy = useCallback(() => {
    if (!playerRef.current) return;

    // remove event listeners
    playerRef.current.removeEventListener(READY, onStateChange);
    playerRef.current.removeEventListener(PLAYING, onStateChange);
    playerRef.current.removeEventListener(BUFFERING, onStateChange);
    playerRef.current.removeEventListener(TEXT_METADATA_CUE, onTimedMetadata);
    playerRef.current.removeEventListener(AUDIO_BLOCKED, onAudioBlocked);
    playerRef.current.removeEventListener(ENDED, onStateChange);
    playerRef.current.removeEventListener(ERROR, onError);

    // delete and nullify player
    playerRef.current.pause();
    playerRef.current.delete();
    playerRef.current = null;
    videoRef.current?.removeAttribute('src'); // remove possible stale src
  }, [onStateChange, onTimedMetadata, onAudioBlocked, onError]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setIsPaused(false);
    setVolumeLevel(defaultVolumeLevel);
    setHasPlayedFinalBuffer(undefined);
    setQualities([{ name: 'Auto' }]);
    setHasLoaded(false);
    setVideoAspectRatio(16 / 9);
    resetIntervalId();
    destroy();
  }, [defaultVolumeLevel, destroy, resetIntervalId]);

  const create = useCallback(() => {
    if (!isPlayerSupported) {
      console.warn(
        'The current browser does not support the Amazon IVS player.'
      );

      return;
    }

    // If a player instance already exists, reset it before creating a new one
    if (playerRef.current) reset();

    playerRef.current = createMediaPlayer();
    playerRef.current.attachHTMLVideoElement(videoRef.current);

    playerRef.current.addEventListener(READY, onStateChange);
    playerRef.current.addEventListener(PLAYING, onStateChange);
    playerRef.current.addEventListener(BUFFERING, onStateChange);
    playerRef.current.addEventListener(TEXT_METADATA_CUE, onTimedMetadata);
    playerRef.current.addEventListener(AUDIO_BLOCKED, onAudioBlocked);
    playerRef.current.addEventListener(ENDED, onStateChange);
    playerRef.current.addEventListener(ERROR, onError);
  }, [reset, onStateChange, onError, onTimedMetadata, onAudioBlocked]);

  const play = useCallback(() => setIsPaused(false), []);

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

  const { shouldBlurPlayer, isBlurReady, canvasRef } = usePlayerBlur({
    ingestConfiguration,
    isLive,
    isLoading,
    videoRef,
    isEnabled: isBlurEnabled
  });

  /**
   * Update the state of the player based on local state.
   * Users can use the controls while the player is loading.
   */
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

    playerRef.current.setMuted(ivsVolume === 0);
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

  // Play the last buffer segment before closing the player
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

  // Load the player
  useEffect(() => {
    if (playbackUrl && isLive) {
      create();
      playerRef.current.load(playbackUrl);
      play();
      updateVolume(defaultVolumeLevel);
    } else {
      reset();
    }
  }, [
    reset,
    isLive,
    playbackUrl,
    create,
    defaultVolumeLevel,
    play,
    updateVolume
  ]);

  // Clean-up the player
  useEffect(() => reset, [reset]);

  // Reset the player and aspect ratio to 16/9 once the livestream has ended
  useEffect(() => {
    if (hasPlayedFinalBuffer) reset();
  }, [hasPlayedFinalBuffer, reset]);

  // Update the video aspect ratio as soon as we are able to retrieve the video dimensions
  const ingestVideoConfig = ingestConfiguration?.video;
  const ingestVideoDim = useMemo(
    () => ({
      videoWidth: ingestVideoConfig?.videoWidth,
      videoHeight: ingestVideoConfig?.videoHeight
    }),
    [ingestVideoConfig?.videoHeight, ingestVideoConfig?.videoWidth]
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    const setAspectRatio = (e, ingestVideoConfig) => {
      const { videoWidth: width, videoHeight: height } =
        ingestVideoConfig || e.target;
      const aspectRatio = parseFloat((width / height).toFixed(5));
      setVideoAspectRatio((prev) => aspectRatio || prev);
    };

    // If we receive the video width and height from the ingest configuration before the
    // loadeddata or timeupdate events have fired, then we will use those dimensions to
    // set the aspect ratio as early as possible
    if (ingestVideoDim.videoWidth && ingestVideoDim.videoHeight) {
      return setAspectRatio(null, ingestVideoDim);
    }

    // 'loadeddata' will not fire in mobile/tablet devices if data-saver is on in browser settings.
    videoEl?.addEventListener('loadeddata', setAspectRatio);
    // 'timeupdate' is used as a fallback.
    videoEl?.addEventListener('timeupdate', setAspectRatio, { once: true });

    return () => {
      videoEl?.removeEventListener('loadeddata', setAspectRatio);
      videoEl?.removeEventListener('timeupdate', setAspectRatio);
    };
  }, [ingestVideoDim]);

  return {
    canvasRef,
    hasError: !!error,
    hasPlayedFinalBuffer,
    instance: playerRef.current,
    isBlurReady,
    isLoading,
    isPaused,
    pause,
    play,
    playerRef,
    qualities,
    selectedQualityName,
    shouldBlurPlayer,
    updateQuality,
    updateVolume,
    videoAspectRatio,
    videoRef,
    volumeLevel
  };
};

export default usePlayer;
