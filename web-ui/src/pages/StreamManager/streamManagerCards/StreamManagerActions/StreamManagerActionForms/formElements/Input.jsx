import PropTypes from 'prop-types';

import Input from '../../../../../../components/Input';

const StreamManagerActionInput = ({ dataKey, onChange, ...inputProps }) => {
  const handleOnChange = ({ target }) =>
    onChange({ [dataKey]: target.value }, dataKey);

  return (
    <Input
      className="dark:bg-darkMode-gray-dark"
      onChange={handleOnChange}
      {...inputProps}
    />
  );
};

StreamManagerActionInput.propTypes = {
  dataKey: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default StreamManagerActionInput;
