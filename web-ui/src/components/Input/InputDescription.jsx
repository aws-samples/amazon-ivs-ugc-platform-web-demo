import PropTypes from 'prop-types';
import { clsm } from '../../utils';

const InputDescription = ({ isVisible = false, description }) => {
  if (!isVisible) return;

  return (
    <span className={clsm(['pt-1', 'text-[13px]', 'text-darkMode-gray-light'])}>
      <p className="text-p3">{description}</p>
    </span>
  );
};

InputDescription.propTypes = {
  description: PropTypes.string.isRequired,
  isVisible: PropTypes.bool
};

export default InputDescription;
