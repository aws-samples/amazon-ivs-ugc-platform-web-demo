import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

import { clsm } from '../../../utils';

const Hamburger = ({ isOpen }) => {
  const width = 24;
  const height = 16;
  const unitHeight = 4;
  const unitWidth = (unitHeight * width) / height;
  const lineProps = useMemo(
    () => ({
      initial: 'closed',
      animate: isOpen ? 'opened' : 'closed',
      strokeLinecap: 'round',
      vectorEffect: 'non-scaling-stroke',
      className: clsm(['stroke-[2.5px]', 'stroke-black', 'dark:stroke-white'])
    }),
    [isOpen]
  );

  return (
    <motion.svg
      viewBox={`0 0 ${unitWidth} ${unitHeight}`}
      className={clsm(['overflow-visible', 'w-6', 'h-4'])}
      preserveAspectRatio="none"
    >
      {/* TOP */}
      <motion.line
        x1="0"
        x2={unitWidth}
        y1="0"
        y2="0"
        variants={{
          closed: { rotate: 0, translateY: 0 },
          opened: { rotate: 45, translateY: 2 }
        }}
        {...lineProps}
      />
      {/* CENTER */}
      <motion.line
        x1="0"
        x2={unitWidth}
        y1="2"
        y2="2"
        variants={{
          closed: { opacity: 1 },
          opened: { opacity: 0 }
        }}
        {...lineProps}
      />
      {/* BOTTOM */}
      <motion.line
        x1="0"
        x2={unitWidth}
        y1="4"
        y2="4"
        variants={{
          closed: { rotate: 0, translateY: 0 },
          opened: { rotate: -45, translateY: -2 }
        }}
        {...lineProps}
      />
    </motion.svg>
  );
};

Hamburger.defaultProps = { isOpen: false };

Hamburger.propTypes = { isOpen: PropTypes.bool };

export default Hamburger;
