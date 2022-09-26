import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
      ariaControls,
      ariaDisabled,
      ariaLabel,
      ariaSelected,
      children,
      className,
      customStyles,
      id,
      isDisabled,
      isLoading,
      name,
      onClick,
      onFocus,
      onKeyDown,
      onMouseDown,
      role,
      saveLocationFromState,
      tabIndex,
      to,
      type,
      variant
    },
    ref
  ) => {
    const location = useLocation();
    const commonProps = {
      ...(!!ariaControls ? { 'aria-controls': ariaControls } : {}),
      ...(!!ariaLabel ? { 'aria-label': ariaLabel } : {}),
      ...(!!role ? { role: role } : {}),
      ...(ariaSelected !== null ? { 'aria-selected': ariaSelected } : {}),
      ...(tabIndex !== null ? { tabIndex } : {}),
      'aria-disabled': ariaDisabled,
      'data-test-id': dataTestId,
      id,
      name,
      ref,
      onClick,
      style: customStyles
    };
    const classes = clsm([
      'button',
      variant,
      ...baseClasses,
      ...variantClasses[variant],
      type === 'nav' && linkClasses,
      className
    ]);

    if (type === 'nav') {
      if (!to) {
        throw new Error("Button with type 'nav' requires a valid 'to' prop.");
      }

      return (
        <Link
          {...commonProps}
          className={classes}
          to={to}
          {...(saveLocationFromState ? { state: { from: location } } : {})}
        >
          {children}
        </Link>
      );
    }

    return (
      <button
        {...commonProps}
        className={classes}
        disabled={isDisabled}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
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
  ariaControls: '',
  ariaDisabled: false,
  ariaLabel: '',
  ariaSelected: null,
  className: '',
  customStyles: {},
  id: undefined,
  isDisabled: false,
  isLoading: false,
  name: '',
  onBlur: undefined,
  onClick: undefined,
  onFocus: undefined,
  onKeyDown: undefined,
  onMouseDown: undefined,
  role: '',
  saveLocationFromState: false,
  tabIndex: null,
  to: '',
  type: 'button',
  variant: 'primary',
  width: ''
};

Button.propTypes = {
  'data-test-id': PropTypes.string,
  ariaControls: PropTypes.string,
  ariaDisabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaSelected: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  customStyles: PropTypes.object,
  id: PropTypes.string,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  name: PropTypes.string,
  onClick: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyDown: PropTypes.func,
  onMouseDown: PropTypes.func,
  role: PropTypes.string,
  saveLocationFromState: PropTypes.bool,
  tabIndex: PropTypes.number,
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
