import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { keepWithinViewport } from './utils';
import TooltipPortal from './TooltipPortal';
import './Tooltip.css';

const Tooltip = ({ children, message, position }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [offsets, setOffsets] = useState();
  const parentRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (isOpen && parentRef.current && tooltipRef.current) {
      const {
        x: parentLeft,
        y: parentY,
        height: parentHeight
      } = parentRef.current.getBoundingClientRect();
      const { height: tooltipHeight } =
        tooltipRef.current.getBoundingClientRect();

      let unboundOffsets;

      if (position === 'above') {
        unboundOffsets = {
          top: parentY - tooltipHeight - 2,
          left: parentLeft
        };
      } else if (position === 'below') {
        unboundOffsets = {
          top: parentY + parentHeight + 2,
          left: parentLeft
        };
      }

      const boundOffsets = keepWithinViewport(
        unboundOffsets,
        tooltipRef.current
      );
      setOffsets(boundOffsets);
    }
  }, [isOpen, position]);

  return (
    <div
      className="with-tooltip"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      ref={parentRef}
    >
      {children}
      <TooltipPortal
        ref={tooltipRef}
        isOpen={isOpen}
        message={message}
        position={offsets}
      />
    </div>
  );
};

Tooltip.defaultProps = { position: 'below' };

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  message: PropTypes.string.isRequired,
  position: PropTypes.string
};

export default Tooltip;
