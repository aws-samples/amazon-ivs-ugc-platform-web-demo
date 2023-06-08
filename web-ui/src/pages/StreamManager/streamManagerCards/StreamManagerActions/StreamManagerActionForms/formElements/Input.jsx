import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../../utils';
import Input from '../../../../../../components/Input';

const StreamManagerActionInput = forwardRef(
  ({ dataKey, onChange, className, ...inputProps }, ref) => {
    const handleOnChange = ({ target }) =>
      onChange({ [dataKey]: target.value }, dataKey);

    return (
      <Input
        className={clsm(['dark:bg-darkMode-gray-dark', className])}
        onChange={handleOnChange}
        ref={ref}
        {...inputProps}
      />
    );
  }
);

StreamManagerActionInput.propTypes = {
  className: PropTypes.string,
  dataKey: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

StreamManagerActionInput.defaultProps = { className: '' };

export default StreamManagerActionInput;
