import { motion } from 'framer-motion';
import { useCallback } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';

const Hamburger = ({ isOpen }) => {
  const width = 24;
  const height = 16;
  const unitHeight = 4;
  const unitWidth = (unitHeight * width) / height;
  const lineProps = useCallback(
    (transformOrigin) => ({
      initial: 'closed',
      animate: isOpen ? 'opened' : 'closed',
      strokeLinecap: 'round',
      vectorEffect: 'non-scaling-stroke',
      className: clsm([
        'stroke-[3.15px]',
        'stroke-black',
        'dark:stroke-white',
        transformOrigin
      ])
    }),
    [isOpen]
  );

  return (
    <motion.svg
      viewBox={`0 0 ${unitWidth} ${unitHeight}`}
      className={clsm([
        'overflow-visible',
        'w-6',
        'h-4',
        'scale-[0.725]',
        isOpen && 'ml-[1px]'
      ])}
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
        {...lineProps('!origin-top')}
      />
      {/* CENTER */}
      <motion.line
        x1="0"
        x2={unitWidth}
        y1={isOpen ? 2 : 2.1}
        y2={isOpen ? 2 : 2.1}
        variants={{
          closed: { opacity: 1 },
          opened: { opacity: 0 }
        }}
        {...lineProps()}
      />
      {/* BOTTOM */}
      <motion.line
        x1="0"
        x2={unitWidth}
        y1={isOpen ? 4 : 4.2}
        y2={isOpen ? 4 : 4.2}
        variants={{
          closed: { rotate: 0, translateY: 0 },
          opened: { rotate: -45, translateY: -2 }
        }}
        {...lineProps('!origin-bottom')}
      />
    </motion.svg>
  );
};

Hamburger.defaultProps = { isOpen: false };

Hamburger.propTypes = { isOpen: PropTypes.bool };

export default Hamburger;
