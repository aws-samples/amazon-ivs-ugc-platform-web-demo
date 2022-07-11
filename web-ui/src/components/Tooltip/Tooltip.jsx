import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import './Tooltip.css';
import { keepWithinViewport } from './utils';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import TooltipPortal from './TooltipPortal';

const Tooltip = ({ children, hasFixedWidth, message, position }) => {
  const { mainRef } = useMobileBreakpoint();
  const [isOpen, setIsOpen] = useState(false);
  const [offsets, setOffsets] = useState();
  const parentRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (isOpen && parentRef.current && tooltipRef.current) {
      const {
        x: parentLeft,
        y: parentY,
        height: parentHeight,
        width: parentWidth
      } = parentRef.current.getBoundingClientRect();
      const { height: tooltipHeight, width: tooltipWidth } =
        tooltipRef.current.getBoundingClientRect();
      const parentYWithScrollOffset = parentY + window.scrollY;

      let unboundOffsets;

      if (position === 'above') {
        unboundOffsets = {
          top: parentYWithScrollOffset - tooltipHeight - 2,
          left: parentLeft - tooltipWidth / 2 + parentWidth / 2
        };
      } else if (position === 'below') {
        unboundOffsets = {
          top: parentYWithScrollOffset + parentHeight + 2,
          left: parentLeft - tooltipWidth / 2 + parentWidth / 2
        };
      }

      const boundOffsets = keepWithinViewport(
        unboundOffsets,
        tooltipRef.current
      );
      setOffsets(boundOffsets);
    }
  }, [isOpen, position]);

  useEffect(() => {
    const hideTooltip = () => setIsOpen(false);
    const mainRefCurrent = mainRef.current;

    mainRef.current?.addEventListener('scroll', hideTooltip);
    window.addEventListener('scroll', hideTooltip);

    return () => {
      mainRefCurrent?.removeEventListener('scroll', hideTooltip);
      window.removeEventListener('scroll', hideTooltip);
    };
  }, [mainRef]);

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
        hasFixedWidth={hasFixedWidth}
      />
    </div>
  );
};

Tooltip.defaultProps = { position: 'below', hasFixedWidth: false };

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  hasFixedWidth: PropTypes.bool,
  message: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['above', 'below'])
};

export default Tooltip;
