import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';

const POSITION = { TOP: 'top', BOTTOM: 'bottom' };

const PlayerOverlay = ({
  children,
  className,
  isGradientVisible,
  isVisible,
  position
}) => (
  <motion.div
    {...createAnimationProps({
      animations: ['fadeIn-full'],
      options: { isVisible }
    })}
    className={clsm([
      'before:absolute',
      'before:dark:to-black-gradient',
      'before:from-transparent',
      'before:h-full',
      'before:left-0',
      'before:opacity-100',
      'before:to-black-gradientLight',
      'before:top-0',
      'before:transition-opacity',
      'before:w-full',
      "before:content-['']",
      'absolute',
      'flex',
      'h-32',
      'left-0',
      'lg:px-4',
      'px-8',
      'w-full',
      'md:rounded-none',
      !isGradientVisible && 'before:opacity-0',
      !isVisible && 'pointer-events-none',
      position === POSITION.TOP && [
        'top-0',
        'pt-8',
        'lg:pt-4',
        'items-start',
        'before:bg-gradient-to-t'
      ],
      position === POSITION.BOTTOM && [
        'bottom-0',
        'pb-8',
        'lg:pb-4',
        'items-end',
        'before:bg-gradient-to-b'
      ],
      className
    ])}
  >
    {children}
  </motion.div>
);

PlayerOverlay.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isGradientVisible: PropTypes.bool,
  isVisible: PropTypes.bool.isRequired,
  position: PropTypes.oneOf(Object.values(POSITION))
};

PlayerOverlay.defaultProps = {
  className: '',
  isGradientVisible: true,
  position: 'bottom'
};

export default PlayerOverlay;
