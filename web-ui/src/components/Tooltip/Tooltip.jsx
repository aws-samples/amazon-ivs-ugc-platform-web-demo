import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import './Tooltip.css';
import { keepWithinViewport } from './utils';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import TooltipPortal from './TooltipPortal';

const Tooltip = ({ children, hasFixedWidth, message, position, translate }) => {
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

      switch (position) {
        case 'above': {
          unboundOffsets = {
            top: parentYWithScrollOffset - tooltipHeight - 2,
            left: parentLeft - tooltipWidth / 2 + parentWidth / 2
          };
          break;
        }
        case 'below': {
          unboundOffsets = {
            top: parentYWithScrollOffset + parentHeight + 2,
            left: parentLeft - tooltipWidth / 2 + parentWidth / 2
          };
          break;
        }
        case 'right': {
          unboundOffsets = {
            top:
              parentYWithScrollOffset +
              Math.abs((parentHeight - tooltipHeight) / 2),
            left: parentLeft + parentWidth + 2
          };
          break;
        }
        case 'left': {
          unboundOffsets = {
            top:
              parentYWithScrollOffset +
              Math.abs((parentHeight - tooltipHeight) / 2)
          };
          break;
        }
        default:
          break; // exhaustive
      }

      const translatedUnboundOffsets = {
        top: unboundOffsets.top - (translate.y || 0),
        left: unboundOffsets.left + (translate.x || 0)
      };

      const boundOffsets = keepWithinViewport(
        translatedUnboundOffsets,
        tooltipRef.current
      );
      setOffsets(boundOffsets);
    }
  }, [isOpen, position, translate.x, translate.y]);

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

Tooltip.defaultProps = {
  position: 'below',
  hasFixedWidth: false,
  translate: { x: 0, y: 0 }
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  hasFixedWidth: PropTypes.bool,
  message: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['above', 'below', 'right', 'left']),
  translate: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number })
};

export default Tooltip;
