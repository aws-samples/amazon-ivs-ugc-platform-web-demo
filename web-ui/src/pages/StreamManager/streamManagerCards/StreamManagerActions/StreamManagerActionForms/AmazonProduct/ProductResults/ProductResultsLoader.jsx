import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../../../utils';
import { createAnimationProps } from '../../../../../../../helpers/animationPropsHelper';
import Spinner from '../../../../../../../components/Spinner';

const ProductResultsLoader = ({ className = '' }) => (
  <motion.div
    key={'results-loader'}
    {...createAnimationProps({
      animations: ['fadeIn-full'],
      transition: { duration: 0.25 }
    })}
    className={clsm(className)}
  >
    <Spinner size="large" variant="light" />
  </motion.div>
);

ProductResultsLoader.propTypes = {
  className: PropTypes.string
};

export default ProductResultsLoader;
