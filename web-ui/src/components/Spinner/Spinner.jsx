import PropTypes from 'prop-types';
import './Spinner.css';

const DIAMETER = { small: '24px', medium: '30px', large: '36px' };

const Spinner = ({ variant, size }) => (
  <span
    className={`spinner ${variant} ${size}`}
    role="progressbar"
    style={{ width: DIAMETER[size], height: DIAMETER[size] }}
  >
    <svg viewBox="22 22 44 44">
      <circle cx="44" cy="44" r="20.2" fill="none" strokeWidth="4px" />
    </svg>
  </span>
);

Spinner.defaultProps = { variant: 'dark', size: 'small' };

Spinner.propTypes = {
  variant: PropTypes.oneOf(['light', 'semi-dark', 'dark']),
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default Spinner;
