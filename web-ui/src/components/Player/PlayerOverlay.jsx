import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';

const POSITION = { TOP: 'top', BOTTOM: 'bottom' };

const PlayerOverlay = ({ children, className, isVisible, position }) => (
  <m.div
    animate={isVisible ? 'visible' : 'hidden'}
    initial="hidden"
    exit="hidden"
    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
    transition={{ duration: 0.25, type: 'tween' }}
    className={clsm([
      'absolute',
      'flex',
      'h-32',
      'left-0',
      'md:rounded-none',
      'px-8',
      'lg:px-4',
      'w-full',
      'from-transparent',
      'to-black-gradientLight',
      'dark:to-black-gradient',
      !isVisible && 'pointer-events-none',
      position === POSITION.TOP && [
        'top-0',
        'pt-8',
        'lg:pt-4',
        'items-start',
        'bg-gradient-to-t'
      ],
      position === POSITION.BOTTOM && [
        'bottom-0',
        'pb-8',
        'lg:pb-4',
        'items-end',
        'bg-gradient-to-b'
      ],
      className
    ])}
  >
    {children}
  </m.div>
);

PlayerOverlay.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  position: PropTypes.oneOf(Object.values(POSITION))
};

PlayerOverlay.defaultProps = {
  className: '',
  position: 'bottom'
};

export default PlayerOverlay;
