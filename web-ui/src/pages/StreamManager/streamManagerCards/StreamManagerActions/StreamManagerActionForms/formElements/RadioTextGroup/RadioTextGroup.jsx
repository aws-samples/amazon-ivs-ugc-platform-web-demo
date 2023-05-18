import { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../../../utils';
import { streamManager as $streamManagerContent } from '../../../../../../../content';
import Button from '../../../../../../../components/Button';
import ErrorMessage from '../../../../../../../components/Input/InputErrorMessage';
import Label from '../../../../../../../components/Input/InputLabel';
import RadioTextInput from './RadioTextInput';
import usePrevious from '../../../../../../../hooks/usePrevious';

const $content = $streamManagerContent.stream_manager_actions;

const StreamManagerActionRadioTextGroup = ({
  addOptionButtonText,
  dataKey,
  label,
  maxOptions,
  minOptions,
  name,
  optionErrors,
  options,
  placeholder,
  selectedDataKey,
  selectedOptionIndex,
  updateData,
  inputType
}) => {
  const radioTextInputRef = useRef([]);
  const addButtonRef = useRef();
  const shouldShowDeleteOptionButton = options.length > minOptions;
  const shouldShowAddOptionButton = options.length < maxOptions;
  const previousOptionLength = usePrevious(options.length);
  const hasSelection =
    !!selectedDataKey &&
    typeof selectedOptionIndex === 'number' &&
    selectedOptionIndex >= 0;
  const [hasFocusOnInput, setHasFocusOnInput] = useState(false);

  useEffect(() => {
    // On focusin, if the previous focused element id string includes the radio group name
    const handleFocusIn = (event) =>
      setHasFocusOnInput(event.relatedTarget?.id.includes(name));

    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [name]);

  useEffect(() => {
    // Focus on newly added option input field only if any option field is already in focus
    if (options.length > previousOptionLength) {
      radioTextInputRef.current[previousOptionLength].focus();
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
    if (!selectedDataKey) return;

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
      ...(selectedDataKey && { [selectedDataKey]: newSelectedOptionIndex })
    });
    if (hasFocusOnInput)
      radioTextInputRef.current[index === 0 ? 0 : index - 1].focus();
  };

  return (
    <div className={clsm(['flex', 'flex-col'])}>
      {label && <Label label={label} htmlFor={name} />}
      <div className={clsm(['flex', 'flex-col', 'space-y-6'])}>
        {options.map((_, index) => (
          <RadioTextInput
            inputType={inputType}
            ref={(el) => (radioTextInputRef.current[index] = el)}
            key={index}
            name={name}
            onChange={handleOptionTextChange}
            index={index}
            isChecked={selectedOptionIndex === index}
            onClick={handleSelectOption}
            value={options[index]}
            onDelete={
              shouldShowDeleteOptionButton
                ? () => handleDeleteOption(index)
                : null
            }
            placeholder={placeholder}
            inputError={optionErrors[index]}
            hasRadioError={!hasSelection}
          />
        ))}
        {selectedDataKey && !hasSelection && (
          <ErrorMessage error={$content.input_error.select_correct_answer} />
        )}
        <Button
          ref={addButtonRef}
          variant="secondary"
          onClick={handleAddOption}
          className={clsm([
            'bg-lightMode-gray',
            'hover:bg-lightMode-gray-hover'
          ])}
          isDisabled={!shouldShowAddOptionButton}
        >
          {addOptionButtonText}
        </Button>
      </div>
    </div>
  );
};

StreamManagerActionRadioTextGroup.defaultProps = {
  addOptionButtonText: '',
  optionErrors: [],
  label: '',
  maxOptions: Infinity,
  minOptions: 0,
  placeholder: '',
  selectedOptionIndex: 0,
  selectedDataKey: undefined
};

StreamManagerActionRadioTextGroup.propTypes = {
  addOptionButtonText: PropTypes.string,
  dataKey: PropTypes.string.isRequired,
  inputType: PropTypes.string.isRequired,
  optionErrors: PropTypes.arrayOf(PropTypes.string),
  label: PropTypes.string,
  maxOptions: PropTypes.number,
  minOptions: PropTypes.number,
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string,
  selectedDataKey: PropTypes.string,
  selectedOptionIndex: PropTypes.number,
  updateData: PropTypes.func.isRequired
};

export default StreamManagerActionRadioTextGroup;
