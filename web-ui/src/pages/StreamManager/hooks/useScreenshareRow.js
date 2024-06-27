import { useCallback, useEffect, useRef, useState } from 'react';
import { getAvatarSrc } from '../../../helpers';
import useDebouncedCallback from '../../../hooks/useDebouncedCallback';
import usePrevious from '../../../hooks/usePrevious';
import useResize from '../../../hooks/useResize';
import { useStageManager } from '../../../contexts/StageManager';

const useScreenshareRow = ({
  containerMinHeightPX = 0,
  containerRef,
  publishingDisplayParticipants,
  videoAudioParticipants = []
}) => {
  const { participantRole } = useStageManager() || {};
  const isScreenshareVisible = publishingDisplayParticipants.length > 0;
  const overflowAvatarsInitialized = useRef(false);
  const videoAudioParticipantsLength = videoAudioParticipants.length;
  const prevVAParticipantLength = usePrevious(videoAudioParticipantsLength);
  const [maxColumnCount, setMaxColumnCount] = useState(0);
  const [overflowAvatars, setOverflowAvatars] = useState([]);
  const isSpectator = participantRole === 'spectator';
  const screenshareParticipantColCount =
    maxColumnCount > videoAudioParticipantsLength
      ? isSpectator
        ? videoAudioParticipantsLength
        : Math.max(2, videoAudioParticipantsLength)
      : maxColumnCount;
  const visibleOverflowAvatars = overflowAvatars.slice(0, 2);
  const isOverflowCardVisible = isScreenshareVisible
    ? videoAudioParticipantsLength > maxColumnCount &&
      visibleOverflowAvatars.length > 0
    : false;
  const hiddenOverflowAvatarsLength = overflowAvatars.slice(2).length;
  const skipUpdateOverflowAvatarsState =
    !isScreenshareVisible ||
    !maxColumnCount ||
    maxColumnCount >= videoAudioParticipantsLength ||
    (overflowAvatarsInitialized.current &&
      prevVAParticipantLength === videoAudioParticipantsLength);

  const updateMaxColumnCount = useCallback(() => {
    if (!isScreenshareVisible || !containerRef.current) return;

    const { clientWidth: vpWidth, clientHeight: vpHeight } =
      containerRef.current;
    const cardAspectRatio = 16 / 9;

    if (vpHeight > containerMinHeightPX) {
      const videoHeight = vpHeight * 0.2;
      const videoWidth = videoHeight * cardAspectRatio;
      const maxColumnCount = Math.max(2, Math.floor(vpWidth / videoWidth));
      setMaxColumnCount(maxColumnCount);
    } else {
      requestAnimationFrame(updateMaxColumnCount);
    }
  }, [isScreenshareVisible, containerRef, containerMinHeightPX]);

  useEffect(() => {
    if (skipUpdateOverflowAvatarsState) return;

    const overflowParticipants = videoAudioParticipants.slice(
      maxColumnCount - 1
    );
    setOverflowAvatars(
      overflowParticipants.reduce((acc, participant) => {
        const { attributes } = participant[1];
        const avatarSrc = getAvatarSrc(attributes);

        return [...acc, avatarSrc];
      }, [])
    );
    overflowAvatarsInitialized.current = true;
  }, [videoAudioParticipants, skipUpdateOverflowAvatarsState, maxColumnCount]);

  useEffect(() => {
    if (!isScreenshareVisible) return;

    updateMaxColumnCount();
  }, [
    isScreenshareVisible,
    updateMaxColumnCount,
    screenshareParticipantColCount
  ]);

  useResize(
    useDebouncedCallback(updateMaxColumnCount, 250, { immediate: false })
  );

  return {
    hiddenOverflowAvatarsLength,
    isOverflowCardVisible,
    isScreenshareVisible,
    maxColumnCount,
    screenshareParticipantColCount,
    publishingDisplayParticipants,
    visibleOverflowAvatars
  };
};

export default useScreenshareRow;
