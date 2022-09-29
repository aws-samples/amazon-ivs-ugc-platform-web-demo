import PropTypes from 'prop-types';
import { useRef } from 'react';

import { clsm } from '../../../../../../utils';
import {
  QUIZ_STREAM_ACTION_ANSWERS_MIN,
  QUIZ_STREAM_ACTION_ANSWERS_MAX
} from '../../../../../../constants';
import Button from '../../../../../../components/Button';
import Label from '../../../../../../components/Input/InputLabel';
import RadioTextInput from './RadioTextInput';

const StreamManagerActionRadioGroup = ({
  addOptionButtonText,
  dataKey,
  label,
  name,
  options,
  selectedDataKey,
  selectedOptionIndex,
  updateData,
  placeholder
}) => {
  const addButtonRef = useRef();
  const showDeleteOptionButton =
    options.length > QUIZ_STREAM_ACTION_ANSWERS_MIN;
  const disableAddOptionButton =
    options.length >= QUIZ_STREAM_ACTION_ANSWERS_MAX;

  const handleOptionTextChange = (value, index) => {
    updateData({
      [dataKey]: [
        ...options.slice(0, index),
        value,
        ...options.slice(index + 1)
      ]
    });
  };
  const handleSelectOption = ({ target }) => {
    updateData({
      [selectedDataKey]: parseInt(target.value)
    });
  };
  const handleAddOption = () => {
    updateData({
      [dataKey]: [...options, '']
    });
    addButtonRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const handleDeleteOption = (index) => {
    let newSelectedOptionIndex = selectedOptionIndex;
    if (selectedOptionIndex > index) {
      newSelectedOptionIndex = selectedOptionIndex - 1;
    } else if (selectedOptionIndex === index) {
      newSelectedOptionIndex = 0;
    }

    updateData({
      [dataKey]: options.filter((_, i) => i !== index),
      [selectedDataKey]: newSelectedOptionIndex
    });
  };

  return (
    <div className={clsm(['flex', 'flex-col'])}>
      {label && <Label label={label} htmlFor={name} />}
      <div className={clsm(['flex', 'flex-col', 'gap-6'])}>
        {options.map((_, index) => (
          <RadioTextInput
            key={index}
            name={name}
            onChange={handleOptionTextChange}
            index={index}
            isChecked={selectedOptionIndex === index}
            value={options[index]}
            onClick={handleSelectOption}
            onDelete={
              showDeleteOptionButton ? () => handleDeleteOption(index) : null
            }
            placeholder={placeholder}
          />
        ))}
        <Button
          ref={addButtonRef}
          variant="secondary"
          onClick={handleAddOption}
          className={clsm([
            'bg-lightMode-gray',
            'hover:bg-lightMode-gray-hover'
          ])}
          isDisabled={disableAddOptionButton}
        >
          {addOptionButtonText}
        </Button>
      </div>
    </div>
  );
};

StreamManagerActionRadioGroup.defaultProps = {
  addOptionButtonText: '',
  label: '',
  placeholder: '',
  selectedOptionIndex: 0
};

StreamManagerActionRadioGroup.propTypes = {
  addOptionButtonText: PropTypes.string,
  dataKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  selectedDataKey: PropTypes.string.isRequired,
  selectedOptionIndex: PropTypes.number,
  updateData: PropTypes.func.isRequired
};

export default StreamManagerActionRadioGroup;
