import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';

const StreamInfo = forwardRef(
  ({ message, icon, playerProfileViewAnimationProps, isVisible }, ref) => {
    const { isProfileViewExpanded, shouldAnimateProfileView } =
      useProfileViewAnimation();
    const { isDefaultResponsiveView } = useResponsiveDevice();

    return (
      <motion.div
        {...playerProfileViewAnimationProps}
        className={clsm([
          'absolute',
          'items-center',
          'justify-center',
          'flex-col',
          'space-y-2',
          'aspect-video',
          'transition-colors',
          'pointer-events-none',
          '-z-10',
          isVisible ? '!flex' : '!hidden',
          shouldAnimateProfileView.current ? 'duration-[400ms]' : 'duration-0',
          isProfileViewExpanded
            ? ['dark:bg-darkMode-gray-medium', 'bg-lightMode-gray-light']
            : 'bg-transparent',
          isProfileViewExpanded && [
            // ensures StreamInfo has the correct dimensions when it mounts in the expanded profile view state
            isDefaultResponsiveView ? 'w-[90%]' : 'w-[70%]',
            'h-auto'
          ]
        ])}
        ref={ref}
      >
        {icon}
        {message && (
          <h2
            className={clsm([
              'text-center',
              'text-lightMode-gray-medium',
              'dark:text-darkMode-gray-light'
            ])}
          >
            {message}
          </h2>
        )}
      </motion.div>
    );
  }
);

StreamInfo.propTypes = {
  icon: PropTypes.node.isRequired,
  isVisible: PropTypes.bool,
  message: PropTypes.string,
  playerProfileViewAnimationProps: PropTypes.object.isRequired
};

StreamInfo.defaultProps = { icon: null, isVisible: false, message: '' };

export default StreamInfo;
