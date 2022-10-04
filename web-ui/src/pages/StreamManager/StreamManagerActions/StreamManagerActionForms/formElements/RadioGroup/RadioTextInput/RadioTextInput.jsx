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
      index,
      isChecked,
      maxLength,
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
            className="radio"
            name={name}
            onChange={onClick}
            type="radio"
            value={index}
          />
          <Input
            className={'dark:bg-darkMode-gray-dark'}
            maxLength={maxLength}
            name={`${name}-${index}`}
            onChange={({ target }) => onChange(target.value, index)}
            placeholder={placeholder}
            value={value}
            ref={ref}
          />
        </div>
        {onDelete && (
          <Button
            variant="icon"
            onClick={onDelete}
            className={clsm([
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
  index: 0,
  isChecked: false,
  maxLength: undefined,
  onChange: noop,
  onClick: noop,
  onDelete: null,
  placeholder: '',
  value: ''
};

StreamManagerRadioTextInput.propTypes = {
  index: PropTypes.number,
  isChecked: PropTypes.bool,
  maxLength: PropTypes.number,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  onDelete: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string
};

export default StreamManagerRadioTextInput;
