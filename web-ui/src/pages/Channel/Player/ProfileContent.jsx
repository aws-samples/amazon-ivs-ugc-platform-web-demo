import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import useResizeObserver from '../../../hooks/useResizeObserver';

const ProfileContent = ({
  isProfileExpanded,
  offlineRef,
  spinnerRef,
  videoRef
}) => {
  const profileContentRef = useRef();

  const updatePlayerContentOffset = useCallback(
    ({ target, contentRect }) => {
      let contentTopOffset = '100%';
      if (isProfileExpanded) {
        const { height: playerHeightOffset } = contentRect;
        const { top: playerTopOffset } = target.getBoundingClientRect();
        contentTopOffset = `${playerHeightOffset + playerTopOffset}px`;
      }

      profileContentRef.current.style.top = contentTopOffset;
    },
    [isProfileExpanded]
  );

  useResizeObserver(
    offlineRef,
    updatePlayerContentOffset,
    !!offlineRef.current && isProfileExpanded
  );
  useResizeObserver(
    spinnerRef,
    updatePlayerContentOffset,
    !!spinnerRef.current && isProfileExpanded
  );
  useResizeObserver(
    videoRef,
    updatePlayerContentOffset,
    !!videoRef.current && isProfileExpanded
  );

  return (
    <div
      className={clsm([
        'absolute',
        'w-full',
        'h-20',
        'top-full',
        'pointer-events-none'
      ])}
      ref={profileContentRef}
    />
  );
};

ProfileContent.defaultProps = {
  isProfileExpanded: false,
  offlineRef: { current: null },
  spinnerRef: { current: null },
  videoRef: { current: null }
};

ProfileContent.propTypes = {
  isProfileExpanded: PropTypes.bool,
  offlineRef: PropTypes.shape({ current: PropTypes.object }),
  spinnerRef: PropTypes.shape({ current: PropTypes.object }),
  videoRef: PropTypes.shape({ current: PropTypes.object })
};

export default ProfileContent;
