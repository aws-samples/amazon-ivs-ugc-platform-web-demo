import PropTypes from 'prop-types';
import { clsm } from '../../utils';
import { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import Spinner from '../Spinner';
import {
  BUTTON_BASE_CLASSES as baseClasses,
  BUTTON_LINK_CLASSES as linkClasses,
  BUTTON_VARIANT_CLASSES as variantClasses,
  BUTTON_HOVER_CLASSES as hoverClasses
} from './ButtonTheme';

const Button = forwardRef(
  (
    {
      'data-testid': dataTestId,
      animationProps,
      ariaControls,
      ariaDisabled,
      ariaLabel,
      ariaSelected,
      children,
      className,
      customStyles,
      disableHover,
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
      'data-testid': dataTestId,
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
      ...(disableHover ? [] : hoverClasses[variant]),
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
      <motion.button
        {...commonProps}
        {...animationProps}
        className={classes}
        disabled={isDisabled}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        type={type}
      >
        {isLoading ? <Spinner /> : children}
      </motion.button>
    );
  }
);

Button.defaultProps = {
  'data-testid': undefined,
  animationProps: undefined,
  ariaControls: '',
  ariaDisabled: false,
  ariaLabel: '',
  ariaSelected: null,
  className: '',
  customStyles: {},
  disableHover: false,
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
  'data-testid': PropTypes.string,
  animationProps: PropTypes.object,
  ariaControls: PropTypes.string,
  ariaDisabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaSelected: PropTypes.bool,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  customStyles: PropTypes.object,
  disableHover: PropTypes.bool,
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
