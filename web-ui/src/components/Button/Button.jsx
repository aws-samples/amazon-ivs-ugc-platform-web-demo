import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { clsm } from '../../utils';

import Spinner from '../Spinner';
import {
  BUTTON_BASE_CLASSES as baseClasses,
  BUTTON_VARIANT_CLASSES as variantClasses,
  BUTTON_LINK_CLASSES as linkClasses
} from './ButtonTheme';

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

    const classes = clsm([
      'button',
      variant,
      ...baseClasses,
      ...variantClasses[variant],
      {
        [className]: !!className,
        [linkClasses]: type === 'nav'
      }
    ]);

    if (type === 'nav') {
      if (!to) {
        throw new Error("Button with type 'nav' requires a valid 'to' prop.");
      }

      return (
        <Link {...commonProps} className={classes} to={to}>
          {children}
        </Link>
      );
    }

    return (
      <button
        {...commonProps}
        className={classes}
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
  to: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset', 'nav']),
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'tertiary',
    'destructive',
    'icon',
    'primaryText',
    'secondaryText',
    'tertiaryText'
  ])
};

export default Button;
