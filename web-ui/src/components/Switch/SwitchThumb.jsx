import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { createAnimationProps } from '../../helpers/animationPropsHelper';

const customVariants = {
  visible: {
    x: '70%'
  },
  hidden: { x: 0 }
};

const customTransition = {
  x: { duration: 0.1 },
  default: { ease: 'linear' }
};

const SwitchThumb = ({
  className = '',
  ownerState = {},
  style = {},
  shouldShowFocusState = false,
  ...restProps
}) => (
  <AnimatePresence initial={false}>
    <motion.span
      {...createAnimationProps({
        customVariants: customVariants,
        transition: customTransition,
        options: { isVisible: ownerState.checked }
      })}
      className={clsm([
        className,
        shouldShowFocusState &&
          (ownerState.checked
            ? [
                '!h-7',
                '!w-7',
                '!ml-0.5',
                'dark:shadow-darkMode-switchThumb-focus',
                'shadow-[0_0_0_6px]',
                'shadow-lightMode-switchThumb-focus'
              ]
            : [
                'dark:shadow-darkMode-switchThumb-focus',
                'h-4',
                'shadow-[0_0_0_6px]',
                'shadow-lightMode-switchThumb-focus',
                'w-4'
              ])
      ])}
      {...restProps}
    />
  </AnimatePresence>
);

SwitchThumb.propTypes = {
  className: PropTypes.string,
  ownerState: PropTypes.object,
  shouldShowFocusState: PropTypes.bool,
  style: PropTypes.object
};

export default SwitchThumb;
