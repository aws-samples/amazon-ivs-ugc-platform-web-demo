import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { clsm, noop } from '../../../../../../../utils';
import { Delete } from '../../../../../../../assets/icons';
import Button from '../../../../../../../components/Button';
import Input from '../../../../../../../components/Input';
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
      <div className={clsm(['flex', 'gap-[22px]', 'w-full'])}>
        <div
          className={clsm([
            'flex',
            'gap-[52px]',
            'md:gap-[44px]',
            'md:ml-3',
            'w-full',
            'relative'
          ])}
        >
          <input
            aria-label={value}
            checked={isChecked}
            className={clsm(['radio', hasRadioError && 'error'])}
            name={name}
            onChange={onClick}
            type="radio"
            value={index}
          />
          <Input
            autoComplete="off"
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
