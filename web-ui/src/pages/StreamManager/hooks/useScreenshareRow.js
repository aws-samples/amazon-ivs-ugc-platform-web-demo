import { useCallback, useEffect, useRef, useState } from 'react';
import { getAvatarSrc } from '../../../helpers';
import usePrevious from '../../../hooks/usePrevious';
import { PARTICIPANT_TYPE_SCREENSHARE } from '../../../constants';
import useResizeObserver from '../../../hooks/useResizeObserver';

const useScreenshareRow = ({
  containerMinHeightPX = 0,
  containerRef,
  participantList,
  videoAudioParticipants = [],
  isInviteParticipantCardVisible
}) => {
  const screenshareParticipants = participantList.filter(
    (participant) =>
      participant[1]?.attributes?.type === PARTICIPANT_TYPE_SCREENSHARE
  );
  const isScreenshareVisible = screenshareParticipants.length > 0;
  const overflowAvatarsInitialized = useRef(false);
  const videoAudioParticipantsLength = videoAudioParticipants.length;
  const prevVAParticipantLength = usePrevious(videoAudioParticipantsLength);
  const [maxColumnCount, setMaxColumnCount] = useState(0);
  const [overflowAvatars, setOverflowAvatars] = useState([]);
  const minRows = isInviteParticipantCardVisible ? 2 : 1;
  const screenshareParticipantColCount =
    maxColumnCount > videoAudioParticipantsLength
      ? Math.max(minRows, videoAudioParticipantsLength)
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

  useResizeObserver(containerRef, updateMaxColumnCount);

  return {
    hiddenOverflowAvatarsLength,
    isOverflowCardVisible,
    isScreenshareVisible,
    maxColumnCount,
    screenshareParticipantColCount,
    screenshareParticipants,
    visibleOverflowAvatars
  };
};

export default useScreenshareRow;
