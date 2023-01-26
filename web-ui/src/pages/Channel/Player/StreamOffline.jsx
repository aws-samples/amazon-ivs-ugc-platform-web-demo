import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { NoSignal } from '../../../assets/icons';
import { player as $content } from '../../../content';

const StreamOffline = forwardRef(
  ({ isProfileExpanded, isVisible, playerAnimationControls }, ref) => (
    <motion.div
      animate={playerAnimationControls}
      className={clsm([
        'absolute',
        'flex-col',
        'justify-center',
        'items-center',
        'space-y-2',
        'aspect-video',
        'transition-colors',
        'duration-[400ms]',
        isVisible ? '!flex' : '!hidden',
        isProfileExpanded
          ? ['dark:bg-darkMode-gray-medium', 'bg-lightMode-gray-light']
          : 'bg-transparent'
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
  )
);

StreamOffline.propTypes = {
  isProfileExpanded: PropTypes.bool,
  isVisible: PropTypes.bool,
  playerAnimationControls: PropTypes.object.isRequired
};

StreamOffline.defaultProps = {
  isProfileExpanded: false,
  isVisible: false
};

export default StreamOffline;
