import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import withPortal from '../withPortal';
import './Tooltip.css';

const TooltipPortal = forwardRef(({ message }, ref) => (
  <span ref={ref} className="tooltip p3">
    {message}
  </span>
));

TooltipPortal.propTypes = {
  message: PropTypes.string.isRequired
};

export default withPortal(TooltipPortal, 'tooltip');
