import PropTypes from 'prop-types';

import Spinner from '../Spinner';
import './Button.css';

const Button = ({
  children,
  className,
  isDisabled,
  isLoading,
  onClick,
  type,
  variant,
  customStyles
}) => (
  <button
    className={`button ${variant} ${className}`}
    disabled={isDisabled}
    onClick={onClick}
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
  onClick: undefined,
  type: 'button',
  variant: 'primary',
  width: ''
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  customStyles: PropTypes.object,
  variant: PropTypes.oneOf([
    'primary',
    'tertiary',
    'secondary',
    'destructive',
    'link'
  ])
};

export default Button;
