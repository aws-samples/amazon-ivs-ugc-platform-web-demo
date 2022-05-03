import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

import withPortal from '../withPortal';
import './Tooltip.css';

const TooltipPortal = withPortal(
  ({ message }) => <span className="tooltip">{message}</span>,
  'tooltip',
  { keepInViewport: true }
);

const Tooltip = ({ children, message }) => {
  const [isOpen, setIsOpen] = useState(false);
  const parentRef = useRef();

  return (
    <div
      className="with-tooltip"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      ref={parentRef}
    >
      {children}
      {parentRef.current && (
        <TooltipPortal
          isOpen={isOpen}
          parentEl={parentRef.current}
          message={message}
        />
      )}
    </div>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  message: PropTypes.string.isRequired
};

export default Tooltip;
