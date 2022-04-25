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
  variant
}) => (
  <button
    className={`button ${variant} ${className}`}
    disabled={isDisabled}
    onClick={onClick}
    type={type}
  >
    {isLoading && type !== 'link' ? <Spinner /> : children}
  </button>
);

Button.defaultProps = {
  className: '',
  isDisabled: false,
  isLoading: false,
  onClick: undefined,
  type: 'button',
  variant: 'primary'
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  isDisabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
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
