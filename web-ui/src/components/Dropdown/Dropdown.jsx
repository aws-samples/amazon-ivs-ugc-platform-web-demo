import PropTypes from 'prop-types';

import { ChevronDown } from '../../assets/icons';
import { clsm } from '../../utils';
import Label from '../../components/Input/InputLabel';

const Dropdown = ({
  id,
  label = null,
  selected,
  options = [],
  onChange = () => {},
  placeholder = ''
}) => (
  <div
    className={clsm([
      '[&>label]:text-black',
      'dark:[&>label]:text-white',
      'space-y-2'
    ])}
  >
    <Label label={label} htmlFor={id} />
    <div className="relative">
      <select
        id={id}
        name={id}
        onChange={onChange}
        value={selected}
        className={clsm([
          'bg-lightMode-gray-light',
          'border-lightMode-gray-light',
          'border-r-5',
          'dark:bg-darkMode-gray-dark',
          'dark:border-darkMode-gray-dark',
          'dark:hover:bg-darkMode-gray-medium-hover',
          'dark:hover:border-darkMode-gray-medium-hover',
          'dark:text-darkMode-gray-light',
          'focus-visible:dark:outline-white',
          'focus-visible:outline-1',
          'focus-visible:outline-black',
          'focus:dark:shadow-white',
          'hover:bg-lightMode-gray-light-hover',
          'hover:border-lightMode-gray-light-hover',
          'pl-5',
          'pr-10',
          'py-3.5',
          'rounded-3xl',
          'text-lightMode-gray-medium',
          'w-full',
          'cursor-pointer',
          'truncate',
          'group-focus:outline-white',
          'appearance-none',
          'group-focus:shadow-[0_0_0_2px_black]',
          'group-focus:dark:shadow-[white]'
        ])}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={clsm([
          'absolute',
          'dark:fill-white',
          'fill-black',
          'h-5',
          'pointer-events-none',
          'right-5',
          'top-4',
          'w-5'
        ])}
      />
    </div>
  </div>
);

Dropdown.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node,
  selected: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string
    })
  ),
  onChange: PropTypes.func,
  placeholder: PropTypes.string
};

export default Dropdown;
