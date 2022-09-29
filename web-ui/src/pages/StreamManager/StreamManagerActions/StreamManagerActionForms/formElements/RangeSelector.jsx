import PropTypes from 'prop-types';

import { bound } from '../../../../../utils';
import { clsm, noop } from '../../../../../utils';
import Input from '../../../../../components/Input';
import InputRange from '../../../../../components/InputRange';
import Label from '../../../../../components/Input/InputLabel';

const RangeSelector = ({
  dataKey,
  label,
  max,
  min,
  name,
  updateData,
  value
}) => {
  const handleOnChange = (value) => {
    updateData({ [dataKey]: parseInt(value) });
  };

  const handleInputOnBlur = ({ target }) => {
    updateData({ [dataKey]: parseInt(bound(target.value, min, max)) });
  };

  return (
    <div>
      {label && <Label label={label} htmlFor={name} />}
      <div className={clsm(['flex', 'gap-4', 'items-center'])}>
        <InputRange
          onChange={handleOnChange}
          value={value || min}
          min={min}
          max={max}
          className={clsm(['!w-full'])}
        />
        <Input
          type="number"
          name={name}
          className={clsm(['w-[92px]', 'dark:bg-darkMode-gray-dark'])}
          value={value.toString()}
          onChange={({ target }) => handleOnChange(target.value)}
          onBlur={handleInputOnBlur}
          min={min}
          max={max}
          variant="horizontal"
        />
      </div>
    </div>
  );
};

RangeSelector.defaultProps = {
  label: '',
  max: 100,
  min: 0,
  updateData: noop,
  value: 0
};

RangeSelector.propTypes = {
  dataKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
  name: PropTypes.string.isRequired,
  updateData: PropTypes.func,
  value: PropTypes.number
};

export default RangeSelector;
