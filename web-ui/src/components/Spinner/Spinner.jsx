import clsx from 'clsx';
import PropTypes from 'prop-types';

import './Spinner.css';

const DIAMETER = { small: '24px', medium: '30px', large: '36px' };

const Spinner = ({ variant, size }) => {
  const classes = clsx(
    [
      'spinner',
      variant,
      size,
      'inline-block',
      'animate-[1.4s_linear_0s_infinite_normal_none_running_rotate-anim]'
    ],
    variant === 'white' && ['text-white'],
    variant === 'light' && ['text-black', 'dark:text-white'],
    variant === 'semi-dark' && [
      'text-lightMode-gray-medium',
      'dark:text-darkMode-gray'
    ],
    variant === 'dark' && ['text-black']
  );

  return (
    <span
      className={classes}
      role="progressbar"
      style={{ width: DIAMETER[size], height: DIAMETER[size] }}
    >
      <svg viewBox="22 22 44 44">
        <circle
          className={clsx([
            'stroke-current',
            'animate-[stroke-anim_1.4s_ease-in-out_infinite]'
          ])}
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

Spinner.defaultProps = { variant: 'dark', size: 'small' };

Spinner.propTypes = {
  variant: PropTypes.oneOf(['white', 'light', 'semi-dark', 'dark']),
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default Spinner;
