import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getAvatarSrc } from '../../../helpers';
import usePrevious from '../../../hooks/usePrevious';
import { PARTICIPANT_TYPES } from '../../../constants';
import useResizeObserver from '../../../hooks/useResizeObserver';

const useScreenshareRow = ({
  containerMinHeightPX = 0,
  videoContainerRef,
  publishingDisplayParticipants,
  videoAudioParticipants = [],
  parentContainerRef
}) => {
  const { collaborate } = useSelector((state) => state.shared);
  const overflowAvatarsInitialized = useRef(false);
  const [maxColumnCount, setMaxColumnCount] = useState(0);
  const [overflowAvatars, setOverflowAvatars] = useState([]);

  // Participants
  const videoAudioParticipantsLength = videoAudioParticipants.length;
  const prevVAParticipantLength = usePrevious(videoAudioParticipantsLength);
  const isSpectator =
    collaborate.participantType === PARTICIPANT_TYPES.SPECTATOR;
  const screenshareParticipantColCount =
    maxColumnCount > videoAudioParticipantsLength
      ? isSpectator
        ? videoAudioParticipantsLength
        : Math.max(2, videoAudioParticipantsLength)
      : maxColumnCount;

  // Screen-share
  const isScreenshareVisible = publishingDisplayParticipants.length > 0;

  // Overflow card
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
    if (!isScreenshareVisible || !videoContainerRef.current) return;

    const { clientWidth: vpWidth, clientHeight: vpHeight } =
      videoContainerRef.current;
    const cardAspectRatio = 16 / 9;

    if (vpHeight > containerMinHeightPX) {
      const videoHeight = vpHeight * 0.2;
      const videoWidth = videoHeight * cardAspectRatio;
      const maxColumnCount = Math.max(2, Math.floor(vpWidth / videoWidth));
      setMaxColumnCount(maxColumnCount);
    } else {
      requestAnimationFrame(updateMaxColumnCount);
    }
  }, [isScreenshareVisible, videoContainerRef, containerMinHeightPX]);

  useEffect(() => {
    if (skipUpdateOverflowAvatarsState) return;

    const overflowParticipants = videoAudioParticipants.slice(
      maxColumnCount - 1
    );
    setOverflowAvatars(
      overflowParticipants.reduce((acc, participant) => {
        const { attributes } = participant;
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

  useResizeObserver(parentContainerRef, updateMaxColumnCount);

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
