import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { DEFAULT_PROFILE_VIEW_TRANSITION } from '../../constants';
import { useProfileViewAnimation } from './contexts/ProfileViewAnimation';
import FloatingNav from '../../components/FloatingNav';

/**
 * This component is a wrapper around the FloatingNav component and is intended
 * to be used to create a smoother transition when switching between the expanded
 * and collapsed profile view states. By default, ProfileViewFloatingNav will hide
 * itself when the profile view is collapsed, and show itself when the profile view
 * expanded. This behavior can be reversed by setting the reverseVisibility prop to true.
 */
const ProfileViewFloatingNav = ({
  className,
  containerClassName,
  reverseVisibility
}) => {
  const { chatAnimationControls, getProfileViewAnimationProps } =
    useProfileViewAnimation();
  const animationDuration = DEFAULT_PROFILE_VIEW_TRANSITION.duration;

  const visibleStyles = {
    opacity: 1,
    visibility: 'visible',
    transition: {
      delay: animationDuration,
      duration: animationDuration / 2
    }
  };

  const hiddenStyles = {
    opacity: 0,
    transition: { duration: animationDuration / 4 },
    transitionEnd: { visibility: 'collapse' }
  };

  return (
    <motion.div
      {...getProfileViewAnimationProps(chatAnimationControls, {
        expanded: reverseVisibility ? hiddenStyles : visibleStyles,
        collapsed: reverseVisibility ? visibleStyles : hiddenStyles
      })}
      className={className}
    >
      <FloatingNav containerClassName={containerClassName} />
    </motion.div>
  );
};

ProfileViewFloatingNav.propTypes = {
  className: PropTypes.string,
  containerClassName: PropTypes.string,
  reverseVisibility: PropTypes.bool
};

ProfileViewFloatingNav.defaultProps = {
  className: '',
  containerClassName: '',
  reverseVisibility: false
};

export default ProfileViewFloatingNav;
