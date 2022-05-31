import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import Spinner from '../Spinner';
import './Button.css';

const Button = forwardRef(
  (
    {
      ariaDisabled,
      children,
      className,
      customStyles,
      isDisabled,
      isLoading,
      onClick,
      onFocus,
      onMouseDown,
      type,
      variant
    },
    ref
  ) => (
    <button
      aria-disabled={ariaDisabled}
      className={`button ${variant} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      onFocus={onFocus}
      onMouseDown={onMouseDown}
      ref={ref}
      style={customStyles}
      type={type}
    >
      {isLoading && type !== 'link' ? <Spinner /> : children}
    </button>
  )
);

Button.defaultProps = {
  ariaDisabled: false,
  className: '',
  customStyles: {},
  isDisabled: false,
  isLoading: false,
  onBlur: undefined,
  onClick: undefined,
  onFocus: undefined,
  onMouseDown: undefined,
  type: 'button',
  variant: 'primary',
  width: ''
};

Button.propTypes = {
  ariaDisabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  customStyles: PropTypes.object,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  onMouseDown: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf([
    'primary',
    'tertiary',
    'secondary',
    'destructive',
    'link',
    'icon'
  ])
};

export default Button;
