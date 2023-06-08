import { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import './InputRange.css';
import { clsm, noop } from '../../utils';
import useMediaQuery from '../../hooks/useMediaQuery';

const rangeDark = {
  track: 'var(--palette-color-white)',
  offset: 'var(--palette-color-light-gray)'
};
const rangeLight = {
  track: 'var(--palette-color-black)',
  offset: 'var(--palette-color-gray)'
};

const InputRange = ({ className, name, value, onChange, max, min }) => {
  const inputRef = useRef(null);
  const prefersColorSchemeDark = useMediaQuery('(prefers-color-scheme: dark)');

  const updateRangeGradient = useCallback(
    (value) => {
      const percentage = ((value - min) / (max - min)) * 100;
      if (prefersColorSchemeDark) {
        return `linear-gradient(to right, ${rangeDark.track} 0%, ${rangeDark.track} ${percentage}%, ${rangeDark.offset} ${percentage}%, ${rangeDark.offset} 100%)`;
      } else {
        return `linear-gradient(to right, ${rangeLight.track} 0%, ${rangeLight.track} ${percentage}%, ${rangeLight.offset} ${percentage}%, ${rangeLight.offset} 100%)`;
      }
    },
    [prefersColorSchemeDark, max, min]
  );

  const handleInputChange = useCallback(
    (event) => onChange(Number(event.target.value)),
    [onChange]
  );

  useEffect(() => {
    inputRef.current.style.background = updateRangeGradient(value);
  }, [value, updateRangeGradient]);

  return (
    <input
      className={clsm(
        [
          'appearance-none',
          'bg-grey',
          'dark:bg-white',
          'form-range',
          'h-[8px]',
          'input-range',
          'rounded-full',
          'sm:w-[80px]',
          'w-[110px]'
        ],
        className
      )}
      data-testid={name}
      max={max.toString()}
      min={min.toString()}
      onInput={handleInputChange}
      ref={inputRef}
      type="range"
      value={value}
    />
  );
};

InputRange.propTypes = {
  className: PropTypes.string,
  max: PropTypes.number,
  min: PropTypes.number,
  name: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.number
};

InputRange.defaultProps = {
  className: '',
  max: 100,
  min: 0,
  name: '',
  onChange: noop,
  value: 100
};

export default InputRange;
