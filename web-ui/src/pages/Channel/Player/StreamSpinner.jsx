import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import Spinner from '../../../components/Spinner';

const StreamSpinner = forwardRef(
  ({ isProfileExpanded, isVisible, playerAnimationControls }, ref) => (
    <motion.div
      animate={playerAnimationControls}
      className={clsm([
        'absolute',
        'justify-center',
        'items-center',
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
      <Spinner size="large" variant="light" />
    </motion.div>
  )
);

StreamSpinner.propTypes = {
  isProfileExpanded: PropTypes.bool,
  isVisible: PropTypes.bool,
  playerAnimationControls: PropTypes.object.isRequired
};

StreamSpinner.defaultProps = {
  isProfileExpanded: false,
  isVisible: false
};

export default StreamSpinner;
