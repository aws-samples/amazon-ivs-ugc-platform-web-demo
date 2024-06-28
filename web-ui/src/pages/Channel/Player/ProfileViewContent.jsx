import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm, isElementOverflowing } from '../../../utils';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import useDidChange from '../../../hooks/useDidChange';
import useResizeObserver from '../../../hooks/useResizeObserver';

const ProfileViewContent = ({
  playerSectionRef = { current: null },
  targetPlayerRef = { current: null }
}) => {
  const { isProfileViewExpanded } = useProfileViewAnimation();
  const { isLandscape } = useResponsiveDevice();
  const didDeviceOrientationChange = useDidChange(isLandscape);
  const profileViewContentRef = useRef();
  const isPlayerSectionOverflowing = useRef(
    isElementOverflowing(playerSectionRef.current)
  );

  const updateProfileViewContentOffset = useCallback(
    ({ target, contentRect }) => {
      let contentTopOffset = '100%';

      if (isProfileViewExpanded) {
        const currIsPlayerSectionOverflowing = isElementOverflowing(
          playerSectionRef.current
        );
        const didPlayerSectionOverflowChange =
          isPlayerSectionOverflowing.current !== undefined &&
          isPlayerSectionOverflowing.current !== currIsPlayerSectionOverflowing;
        isPlayerSectionOverflowing.current = currIsPlayerSectionOverflowing;

        if (didPlayerSectionOverflowChange) return;

        const { height: playerHeightOffset } = contentRect;
        const playerTopOffset = parseInt(target.style.top);

        contentTopOffset = `${playerHeightOffset + playerTopOffset}px`;
      }

      profileViewContentRef.current.style.top = contentTopOffset;
    },
    [isProfileViewExpanded, playerSectionRef]
  );

  useResizeObserver(targetPlayerRef, updateProfileViewContentOffset);

  useEffect(() => {
    if (didDeviceOrientationChange) {
      const targetElement = targetPlayerRef.current;

      updateProfileViewContentOffset({
        target: targetElement,
        contentRect: targetElement.getBoundingClientRect()
      });
    }
  }, [
    didDeviceOrientationChange,
    targetPlayerRef,
    updateProfileViewContentOffset
  ]);

  return (
    <div
      className={clsm([
        'absolute',
        'w-full',
        'h-28',
        'top-full',
        'pointer-events-none'
      ])}
      ref={profileViewContentRef}
    />
  );
};

ProfileViewContent.propTypes = {
  playerSectionRef: PropTypes.shape({ current: PropTypes.object }),
  targetPlayerRef: PropTypes.shape({ current: PropTypes.object })
};

export default ProfileViewContent;
