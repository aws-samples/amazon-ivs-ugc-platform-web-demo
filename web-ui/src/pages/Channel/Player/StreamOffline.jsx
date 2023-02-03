import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { NoSignal } from '../../../assets/icons';
import { player as $content } from '../../../content';
import { useProfileViewAnimation } from '../contexts/ProfileViewAnimation';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';

const StreamOffline = forwardRef(
  ({ playerProfileViewAnimationProps, isVisible }, ref) => {
    const { isProfileViewExpanded, shouldAnimateProfileView } =
      useProfileViewAnimation();
    const { isMobileView } = useResponsiveDevice();

    return (
      <motion.div
        {...playerProfileViewAnimationProps}
        className={clsm([
          'absolute',
          'flex-col',
          'justify-center',
          'items-center',
          'space-y-2',
          'aspect-video',
          'transition-colors',
          shouldAnimateProfileView.current ? 'duration-[400ms]' : 'duration-0',
          isVisible ? '!flex' : '!hidden',
          isProfileViewExpanded
            ? ['dark:bg-darkMode-gray-medium', 'bg-lightMode-gray-light']
            : 'bg-transparent',
          isProfileViewExpanded && [
            isMobileView ? 'w-[80%]' : 'w-[70%]',
            'h-auto'
          ] // ensures StreamOffline has the correct dimensions when it mounts in the expanded profile view state
        ])}
        ref={ref}
      >
        <NoSignal
          className={clsm([
            'fill-lightMode-gray-medium',
            'dark:fill-darkMode-gray-light'
          ])}
        />
        <h2
          className={clsm([
            'text-lightMode-gray-medium',
            'dark:text-darkMode-gray-light'
          ])}
        >
          {$content.stream_offline}
        </h2>
      </motion.div>
    );
  }
);

StreamOffline.propTypes = {
  playerProfileViewAnimationProps: PropTypes.object.isRequired,
  isVisible: PropTypes.bool
};

StreamOffline.defaultProps = { isVisible: false };

export default StreamOffline;
