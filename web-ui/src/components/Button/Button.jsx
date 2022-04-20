import PropTypes from 'prop-types';

import Spinner from '../Spinner';
import './Button.css';

const Button = ({
  children,
  isDisabled,
  isLoading,
  variant,
  type,
  onClick,
  className
}) => (
  <button
    className={`button ${!isDisabled ? variant : ''} ${className}`}
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
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'link'])
};

export default Button;
