import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import withPortal from '../withPortal';
import './Tooltip.css';

const TooltipPortal = forwardRef(({ hasFixedWidth, message }, ref) => (
  <span
    ref={ref}
    className={`tooltip p3 ${hasFixedWidth ? 'fixed-width' : ''}`}
  >
    {message}
  </span>
));

TooltipPortal.defaultProps = { hasFixedWidth: false };

TooltipPortal.propTypes = {
  hasFixedWidth: PropTypes.bool,
  message: PropTypes.string.isRequired
};

export default withPortal(TooltipPortal, 'tooltip');
