import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

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
      subVariant,
      to
    },
    ref
  ) => {
    const commonProps = {
      ...(!!ariaLabel ? { 'aria-label': ariaLabel } : {}),
      'aria-disabled': ariaDisabled,
      'data-test-id': dataTestId,
      id,
      ref,
      style: customStyles
    };

    const classes = ['button', variant];
    if (className) classes.push(className);
    if (subVariant) classes.push(subVariant);

    if (type === 'nav') {
      if (!to) {
        throw new Error("Button with type 'nav' requires a valid 'to' prop.");
      }

      classes.push('button-as-link');

      return (
        <Link {...commonProps} className={classes.join(' ')} to={to}>
          {children}
        </Link>
      );
    }

    return (
      <button
        {...commonProps}
        className={classes.join(' ')}
        disabled={isDisabled}
        onClick={onClick}
        onFocus={onFocus}
        onMouseDown={onMouseDown}
        type={type}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    );
  }
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
  to: '',
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
  subVariant: PropTypes.oneOf(['first', 'second', 'third', '']),
  to: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset', 'nav']),
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
