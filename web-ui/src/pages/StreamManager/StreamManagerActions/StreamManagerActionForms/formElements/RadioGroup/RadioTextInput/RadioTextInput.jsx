import PropTypes from 'prop-types';

import { clsm, noop } from '../../../../../../../utils';
import { Delete } from '../../../../../../../assets/icons';
import Button from '../../../../../../../components/Button';
import Input from '../../../../../../../components/Input';
import './RadioTextInput.css';

const StreamManagerRadioTextInput = ({
  index,
  isChecked,
  name,
  onChange,
  onClick,
  onDelete,
  value,
  placeholder
}) => {
  return (
    <div className={clsm(['flex', 'gap-[22px]', 'w-full'])}>
      <div
        className={clsm([
          'flex',
          'gap-[52px]',
          'md:gap-[44px]',
          'md:ml-3',
          'w-full'
        ])}
      >
        <input
          type="radio"
          value={index}
          name={name}
          checked={isChecked}
          onChange={onClick}
          className={clsm('radio')}
          aria-label={value}
        />
        <Input
          name={`${name}-${index}`}
          onChange={({ target }) => onChange(target.value, index)}
          value={value}
          placeholder={placeholder}
          className={clsm(['dark:bg-darkMode-gray-dark'])}
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
};

StreamManagerRadioTextInput.defaultProps = {
  index: 0,
  isChecked: false,
  onChange: noop,
  onClick: noop,
  onDelete: null,
  placeholder: '',
  value: ''
};

StreamManagerRadioTextInput.propTypes = {
  index: PropTypes.number,
  isChecked: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  onDelete: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string
};

export default StreamManagerRadioTextInput;
