import PropTypes from 'prop-types';

import './Button.css';

const Button = ({ children, isDisabled, variant, type, onClick }) => (
  <button
    className={`button ${!isDisabled ? variant : ''}`}
    disabled={isDisabled}
    onClick={onClick}
    type={type}
  >
    {children}
  </button>
);

Button.defaultProps = {
  isDisabled: false,
  type: 'button',
  variant: 'primary',
  onClick: undefined
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  isDisabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  onClick: PropTypes.func
};

export default Button;
