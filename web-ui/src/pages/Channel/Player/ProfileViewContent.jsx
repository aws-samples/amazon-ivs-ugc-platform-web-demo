import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import useResizeObserver from '../../../hooks/useResizeObserver';

const ProfileViewContent = ({ targetPlayerRef }) => {
  const { isProfileViewExpanded } = useProfileViewAnimation();
  const ProfileViewContentRef = useRef();

  const updatePlayerContentOffset = useCallback(
    ({ target, contentRect }) => {
      let contentTopOffset = '100%';

      if (isProfileViewExpanded) {
        const { height: playerHeightOffset } = contentRect;
        const playerTopOffset = parseInt(target.style.top);
        contentTopOffset = `${playerHeightOffset + playerTopOffset}px`;
      }

      ProfileViewContentRef.current.style.top = contentTopOffset;
    },
    [isProfileViewExpanded]
  );

  useResizeObserver(targetPlayerRef, updatePlayerContentOffset);

  return (
    <div
      className={clsm([
        'absolute',
        'w-full',
        'h-28',
        'top-full',
        'pointer-events-none'
      ])}
      ref={ProfileViewContentRef}
    />
  );
};

ProfileViewContent.defaultProps = { targetPlayerRef: { current: null } };

ProfileViewContent.propTypes = {
  targetPlayerRef: PropTypes.shape({ current: PropTypes.object })
};

export default ProfileViewContent;
