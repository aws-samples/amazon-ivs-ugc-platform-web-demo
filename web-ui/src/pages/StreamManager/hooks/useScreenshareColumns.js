import { useCallback, useEffect, useRef, useState } from 'react';
import { getAvatarSrc } from '../../../helpers';
import useDebouncedCallback from '../../../hooks/useDebouncedCallback';
import usePrevious from '../../../hooks/usePrevious';
import useResize from '../../../hooks/useResize';

const useScreenshareColumns = ({
  participantSize,
  isScreenshareLayout,
  containerRef,
  participantList
}) => {
  const hasMounted = useRef(false);
  const prevParticipantSize = usePrevious(participantSize);
  const [maxColumnCount, setMaxColumnCount] = useState(0);
  const [overflowAvatars, setOverflowAvatars] = useState([]);
  const screenshareParticipantColCount =
    maxColumnCount > participantSize
      ? Math.max(2, participantSize)
      : maxColumnCount;
  const displayOverflowCard = participantSize > maxColumnCount;
  const visibleOverflowAvatars = overflowAvatars?.slice(0, 2);
  const additionalOverflowCount = overflowAvatars?.slice(2).length;
  const shouldUpdateOverflowAvatars =
    !hasMounted.current || prevParticipantSize !== participantSize;

  const updateMaxColumnCount = useCallback(() => {
    if (!isScreenshareLayout || !containerRef.current) return;

    const { clientWidth: vpWidth, clientHeight: vpHeight } =
      containerRef.current;
    const videoHeight = vpHeight * 0.2;
    const videoWidth = videoHeight * (16 / 9);
    const maxColumnCount = Math.max(2, Math.floor(vpWidth / videoWidth));
    setMaxColumnCount(maxColumnCount);
  }, [isScreenshareLayout, containerRef]);

  useEffect(() => {
    if (
      !isScreenshareLayout ||
      !maxColumnCount ||
      maxColumnCount >= participantSize ||
      !shouldUpdateOverflowAvatars
    )
      return;

    const overflowParticipants = participantList.slice(maxColumnCount - 1);
    setOverflowAvatars(
      overflowParticipants.reduce((acc, participant) => {
        const { attributes } = participant[1];
        const avatarSrc = getAvatarSrc(attributes);
        return [...acc, avatarSrc];
      }, [])
    );
    hasMounted.current = true;
  }, [
    isScreenshareLayout,
    maxColumnCount,
    participantList,
    participantSize,
    shouldUpdateOverflowAvatars
  ]);

  useEffect(() => {
    updateMaxColumnCount();
  }, [updateMaxColumnCount, screenshareParticipantColCount]);

  useResize(
    useDebouncedCallback(updateMaxColumnCount, 250, { immediate: false })
  );

  return {
    displayOverflowCard,
    visibleOverflowAvatars,
    additionalOverflowCount,
    screenshareParticipantColCount,
    maxColumnCount
  };
};

export default useScreenshareColumns;
