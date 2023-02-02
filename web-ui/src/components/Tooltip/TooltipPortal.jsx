import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { clsm } from '../../utils';

import withPortal from '../withPortal';

const TooltipPortal = forwardRef(({ hasFixedWidth, message }, ref) => {
  if (!message) return;

  return (
    <span
      ref={ref}
      className={clsm([
        'bg-lightMode-gray',
        'dark:bg-darkMode-gray',
        'p-2.5',
        'rounded-xl',
        'text-p3',
        hasFixedWidth && 'max-w-[200px]'
      ])}
      data-testid="tooltip-content"
    >
      {message}
    </span>
  );
});

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
