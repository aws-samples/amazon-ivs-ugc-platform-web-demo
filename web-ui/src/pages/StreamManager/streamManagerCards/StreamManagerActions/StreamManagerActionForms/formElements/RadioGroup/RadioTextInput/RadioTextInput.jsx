import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { clsm, noop } from '../../../../../../../../utils';
import { Delete } from '../../../../../../../../assets/icons';
import Button from '../../../../../../../../components/Button';
import Input from '../../../../../../../../components/Input';
import './RadioTextInput.css';

const StreamManagerRadioTextInput = forwardRef(
  (
    {
      hasRadioError,
      index,
      inputError,
      isChecked,
      name,
      onChange,
      onClick,
      onDelete,
      placeholder,
      value
    },
    ref
  ) => {
    return (
      <div className={clsm(['flex', 'space-x-[22px]', 'w-full'])}>
        <div
          className={clsm([
            'flex',
            'space-x-[52px]',
            'md:space-x-[44px]',
            'md:ml-3',
            'w-full',
            'relative'
          ])}
        >
          <input
            aria-label={value}
            checked={isChecked}
            className={clsm(['radio', hasRadioError && 'error'])}
            data-testid={`${name}-${value}-radio-button`}
            name={name}
            onChange={onClick}
            type="radio"
            value={index}
          />
          <Input
            className={'dark:bg-darkMode-gray-dark'}
            error={inputError}
            name={`${name}-${index}`}
            onChange={({ target }) => onChange(target.value, index)}
            placeholder={placeholder}
            ref={ref}
            value={value}
          />
        </div>
        {onDelete && (
          <Button
            data-testid={`delete-${value || name}-item-button`}
            variant="icon"
            onClick={onDelete}
            className={clsm([
              'h-11',
              'w-11',
              '[&>svg]:h-6',
              '[&>svg]:w-6',
              'dark:[&>svg]:fill-darkMode-gray-light'
            ])}
            ariaLabel={`delete ${value || name} item`}
          >
            <Delete />
          </Button>
        )}
      </div>
    );
  }
);

StreamManagerRadioTextInput.defaultProps = {
  hasRadioError: false,
  index: 0,
  inputError: null,
  isChecked: false,
  onChange: noop,
  onClick: noop,
  onDelete: null,
  placeholder: '',
  value: ''
};

StreamManagerRadioTextInput.propTypes = {
  hasRadioError: PropTypes.bool,
  index: PropTypes.number,
  inputError: PropTypes.string,
  isChecked: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  onDelete: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string
};

export default StreamManagerRadioTextInput;
