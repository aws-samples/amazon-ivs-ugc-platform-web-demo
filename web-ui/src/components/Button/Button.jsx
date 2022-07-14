import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import Spinner from '../Spinner';
import './Button.css';

const Button = forwardRef(
  (
    {
      'data-test-id': dataTestId,
      ariaDisabled,
      ariaLabel,
      children,
      className,
      customStyles,
      id,
      isDisabled,
      isLoading,
      onClick,
      onFocus,
      onMouseDown,
      type,
      variant,
      subVariant
    },
    ref
  ) => (
    <button
      {...(!!ariaLabel ? { 'aria-label': ariaLabel } : {})}
      data-test-id={dataTestId}
      aria-disabled={ariaDisabled}
      className={`button ${className} ${variant} ${subVariant}`}
      disabled={isDisabled}
      id={id}
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
  'data-test-id': undefined,
  ariaDisabled: false,
  ariaLabel: '',
  className: '',
  customStyles: {},
  id: undefined,
  isDisabled: false,
  isLoading: false,
  onBlur: undefined,
  onClick: undefined,
  onFocus: undefined,
  onMouseDown: undefined,
  subVariant: '',
  type: 'button',
  variant: 'primary',
  width: ''
};

Button.propTypes = {
  'data-test-id': PropTypes.string,
  ariaDisabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  customStyles: PropTypes.object,
  id: PropTypes.string,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  onMouseDown: PropTypes.func,
  subVariant: PropTypes.oneOf(['first', 'second', '']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'icon',
    'text'
  ])
};

export default Button;
