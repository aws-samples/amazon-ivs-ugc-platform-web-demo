import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import Spinner from '../../../components/Spinner';

const StreamSpinner = forwardRef(
  ({ isVisible, playerProfileViewAnimationProps }, ref) => {
    const { isProfileViewExpanded, shouldAnimateProfileView } =
      useProfileViewAnimation();
    const { isMobileView } = useResponsiveDevice();

    return (
      <motion.div
        {...playerProfileViewAnimationProps}
        className={clsm([
          'absolute',
          'justify-center',
          'items-center',
          'aspect-video',
          'transition-colors',
          'pointer-events-none',
          shouldAnimateProfileView.current ? 'duration-[400ms]' : 'duration-0',
          isVisible ? '!flex' : '!hidden',
          isProfileViewExpanded
            ? ['dark:bg-darkMode-gray-medium', 'bg-lightMode-gray-light']
            : 'bg-transparent',
          isProfileViewExpanded && [
            isMobileView ? 'w-[80%]' : 'w-[70%]',
            'h-auto'
          ] // ensures StreamSpinner has the correct dimensions when it mounts in the expanded profile view state
        ])}
        ref={ref}
      >
        <Spinner size="large" variant="light" />
      </motion.div>
    );
  }
);

StreamSpinner.propTypes = {
  playerProfileViewAnimationProps: PropTypes.object.isRequired,
  isVisible: PropTypes.bool
};

StreamSpinner.defaultProps = { isVisible: false };

export default StreamSpinner;
