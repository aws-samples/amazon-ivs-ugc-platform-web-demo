import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import './Tooltip.css';
import { clsm } from '../../utils';
import withPortal from '../withPortal';

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
  message: PropTypes.node.isRequired
};

export default withPortal(TooltipPortal, 'tooltip', {
  baseContainerClasses: clsm([
    'absolute',
    'flex',
    'items-center',
    'justify-center',
    'w-max',
    'z-[900]'
  ])
});
