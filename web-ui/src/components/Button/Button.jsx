import PropTypes from 'prop-types';

import Spinner from '../Spinner';
import './Button.css';

const Button = ({
  children,
  className,
  isDisabled,
  isLoading,
  onClick,
  onFocus,
  onMouseDown,
  type,
  variant,
  customStyles
}) => (
  <button
    aria-disabled={isDisabled}
    className={`button ${variant} ${className}`}
    onClick={onClick}
    onFocus={onFocus}
    onMouseDown={onMouseDown}
    style={customStyles}
    type={type}
  >
    {isLoading && type !== 'link' ? <Spinner /> : children}
  </button>
);

Button.defaultProps = {
  className: '',
  customStyles: {},
  isDisabled: false,
  isLoading: false,
  onBlur: undefined,
  onClick: undefined,
  onFocus: undefined,
  onMouseDown: undefined,
  tabIndex: 0,
  type: 'button',
  variant: 'primary',
  width: ''
};

Button.propTypes = {
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
    'link'
  ])
};

export default Button;
