import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { Close } from '../../../../../assets/icons';
import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';

const UploadAvatarMarker = ({ isOpen, isUploaded }) => (
  <>
    <motion.span
      {...createAnimationProps({
        animations: ['fadeIn-full'],
        options: { isVisible: isOpen || isUploaded }
      })}
      className={clsm([
        'absolute',
        'rounded-full',
        'w-12',
        'h-12',
        isUploaded
          ? ['bg-lightOverlay', 'dark:bg-modalOverlay']
          : ['bg-white', 'dark:bg-darkMode-gray-dark']
      ])}
    />
    <motion.span
      {...createAnimationProps({
        customVariants: {
          hidden: { rotate: 45 },
          visible: { rotate: 0 }
        },
        options: { isVisible: isOpen }
      })}
      className="absolute"
    >
      <Close
        className={clsm(['w-6', 'h-6', 'fill-black', 'dark:fill-white'])}
      />
    </motion.span>
  </>
);

UploadAvatarMarker.propTypes = {
  isOpen: PropTypes.bool,
  isUploaded: PropTypes.bool
};

UploadAvatarMarker.defaultProps = {
  isOpen: true,
  isUploaded: true
};

export default UploadAvatarMarker;
