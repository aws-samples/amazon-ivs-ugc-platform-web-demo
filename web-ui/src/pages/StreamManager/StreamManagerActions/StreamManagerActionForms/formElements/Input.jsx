import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import Input from '../../../../../components/Input';

const StreamManagerActionInput = ({
  dataKey,
  label,
  name,
  onChange,
  placeholder,
  value
}) => {
  const handleOnChange = ({ target }) => {
    onChange({ [dataKey]: target.value });
  };

  return (
    <Input
      label={label}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={handleOnChange}
      className={clsm(['dark:bg-darkMode-gray-dark'])}
    />
  );
};

StreamManagerActionInput.defaultProps = {
  label: '',
  placeholder: '',
  value: ''
};

StreamManagerActionInput.propTypes = {
  dataKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string
};

export default StreamManagerActionInput;
