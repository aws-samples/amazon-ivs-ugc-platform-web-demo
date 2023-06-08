import PropTypes from 'prop-types';
import { clsm } from '../../utils';

const InputDescription = ({ isVisible, description }) => {
  if (!isVisible) return;

  return (
    <span className={clsm(['pt-1', 'text-[13px]', 'text-darkMode-gray-light'])}>
      <p className="text-p3">{description}</p>
    </span>
  );
};

InputDescription.defaultProps = {
  isVisible: false
};

InputDescription.propTypes = {
  description: PropTypes.string.isRequired,
  isVisible: PropTypes.bool
};

export default InputDescription;
