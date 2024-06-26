import PropTypes from 'prop-types';
import { clsm } from '../../utils';

const InputLabel = ({ label, htmlFor = undefined, variant = 'vertical' }) => {
  if (!label) return;

  return (
    <label
      className={clsm(
        ['label', 'h4', 'w-fit', 'mb-2'],
        variant === 'horizontal' && ['flex', 'h-full', 'items-center', 'mb-0']
      )}
      htmlFor={htmlFor}
    >
      {label}
    </label>
  );
};

InputLabel.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  variant: PropTypes.oneOf(['vertical', 'horizontal'])
};

export default InputLabel;
