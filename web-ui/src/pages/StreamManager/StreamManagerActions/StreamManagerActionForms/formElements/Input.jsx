import PropTypes from 'prop-types';

import Input from '../../../../../components/Input';

const StreamManagerActionInput = ({
  dataKey,
  label,
  name,
  onChange,
  placeholder,
  value,
  maxLength
}) => {
  const handleOnChange = ({ target }) => {
    onChange({ [dataKey]: target.value });
  };

  return (
    <Input
      className="dark:bg-darkMode-gray-dark"
      label={label}
      maxLength={maxLength}
      name={name}
      onChange={handleOnChange}
      placeholder={placeholder}
      value={value}
    />
  );
};

StreamManagerActionInput.defaultProps = {
  label: '',
  maxLength: undefined,
  placeholder: '',
  value: ''
};

StreamManagerActionInput.propTypes = {
  dataKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  maxLength: PropTypes.number,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string
};

export default StreamManagerActionInput;
