import { useRef } from 'react';
import { clsm } from '../../utils';
import PropTypes from 'prop-types';

const InputRange = ({ value, name, handleChange, max, min }) => {
  const inputRef = useRef(null);

  const handleInputChange = (event) => {
    var value = ((Number(event.target.value) - min) / (max - min)) * 100;
    let bg;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      bg = `linear-gradient(to right, #fff 0%, #fff ${value}%, #ABAFBD ${value}%, #ABAFBD 100%)`;
    } else {
      bg = `linear-gradient(to right, #000000 0%, #000000 ${value}%, #fff ${value}%, #fff 100%)`;
    }
    inputRef.current.style.background = bg;
  };

  return (
    <input
      ref={inputRef}
      onInput={handleInputChange}
      type="range"
      min={min.toString()}
      max={max.toString()}
      value={value}
      steps="1"
      className={clsm([
        'w-[110px]',
        'h-[8px]',
        'rounded-full',
        'bg-grey',
        'form-range',
        'appearance-none',
        'dark:bg-white',
        'slider'
      ])}
      onChange={(e) => handleChange(Number(e.target.value))}
    />
  );
};

InputRange.propTypes = {
  value: PropTypes.number,
  name: PropTypes.string,
  handleChange: PropTypes.func,
  max: PropTypes.number,
  min: PropTypes.number
};

InputRange.defaultProps = {
  value: 100,
  name: '',
  handleChange: () => {},
  max: 100,
  min: 0
};

export default InputRange;
