import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../../utils';
import {
  STREAM_ACTION_NAME,
  STREAM_MANAGER_ACTION_LIMITS
} from '../../../../../../constants';
import Button from '../../../../../../components/Button';
import Label from '../../../../../../components/Input/InputLabel';
import RadioTextInput from './RadioTextInput';
import usePrevious from '../../../../../../hooks/usePrevious';

const LIMITS = STREAM_MANAGER_ACTION_LIMITS[STREAM_ACTION_NAME.QUIZ];

const StreamManagerActionRadioGroup = ({
  addOptionButtonText,
  dataKey,
  label,
  name,
  options,
  selectedDataKey,
  selectedOptionIndex,
  updateData,
  placeholder,
  maxLengthPerOption
}) => {
  const radioInputRefs = useRef([]);
  const addButtonRef = useRef();
  const showDeleteOptionButton = options.length > LIMITS.answers.min;
  const disableAddOptionButton = options.length >= LIMITS.answers.max;
  const previousOptionLength = usePrevious(options.length);

  useEffect(() => {
    // Focus on newly added option input field
    if (options.length > previousOptionLength) {
      radioInputRefs.current[previousOptionLength].focus();
    }
  }, [previousOptionLength, options.length]);

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
    radioInputRefs.current[index === 0 ? 0 : index - 1].focus();
  };

  return (
    <div className={clsm(['flex', 'flex-col'])}>
      {label && <Label label={label} htmlFor={name} />}
      <div className={clsm(['flex', 'flex-col', 'gap-6'])}>
        {options.map((_, index) => (
          <RadioTextInput
            ref={(el) => (radioInputRefs.current[index] = el)}
            key={index}
            name={name}
            onChange={handleOptionTextChange}
            index={index}
            isChecked={selectedOptionIndex === index}
            maxLength={maxLengthPerOption}
            onClick={handleSelectOption}
            value={options[index]}
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
  maxLengthPerOption: undefined,
  placeholder: '',
  selectedOptionIndex: 0
};

StreamManagerActionRadioGroup.propTypes = {
  addOptionButtonText: PropTypes.string,
  dataKey: PropTypes.string.isRequired,
  label: PropTypes.string,
  maxLengthPerOption: PropTypes.number,
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  selectedDataKey: PropTypes.string.isRequired,
  selectedOptionIndex: PropTypes.number,
  updateData: PropTypes.func.isRequired
};

export default StreamManagerActionRadioGroup;
