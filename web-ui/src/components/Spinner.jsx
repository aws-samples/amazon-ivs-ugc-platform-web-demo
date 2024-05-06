import PropTypes from 'prop-types';

import { clsm } from '../utils';

const DIAMETER = {
  small: '24px',
  medium: '32px',
  large: '36px',
  xlarge: '40px'
};

const Spinner = ({ variant = 'dark', size = 'small', className = '' }) => {
  const classes = clsm(
    [
      'spinner',
      variant,
      size,
      'inline-block',
      'animate-[spin_1.4s_linear_infinite]'
    ],
    variant === 'white' && ['text-white'],
    variant === 'light' && ['text-black', 'dark:text-white'],
    variant === 'semi-dark' && [
      'text-lightMode-gray-medium',
      'dark:text-darkMode-gray'
    ],
    variant === 'dark' && ['text-black'],
    className
  );

  return (
    <span
      className={classes}
      data-testid="loading-spinner"
      role="progressbar"
      style={{ width: DIAMETER[size], height: DIAMETER[size] }}
    >
      <svg viewBox="22 22 44 44">
        <circle
          className={clsm(['stroke-current', 'animate-spinnerStroke'])}
          cx="44"
          cy="44"
          r="20.2"
          fill="none"
          strokeDasharray="80px, 200px"
          strokeLinecap="round"
          strokeWidth="4px"
        />
      </svg>
    </span>
  );
};

Spinner.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf(['white', 'light', 'semi-dark', 'dark']),
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge'])
};

export default Spinner;
