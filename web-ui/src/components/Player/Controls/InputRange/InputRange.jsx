import PropTypes from 'prop-types';
import { useRef, useEffect, useCallback } from 'react';

import { clsm, noop } from '../../../../utils';
import useMediaQuery from '../../../../hooks/useMediaQuery';
import './InputRange.css';

const volumeDark = {
  track: 'var(--palette-color-white)',
  offset: 'var(--palette-color-light-gray)'
};
const volumeLight = {
  track: 'var(--palette-color-black)',
  offset: 'var(--palette-color-gray)'
};

const InputRange = ({ value, handleChange, max, min, onFocus }) => {
  const inputRef = useRef(null);
  const preferedColorSchemeDark = useMediaQuery('(prefers-color-scheme: dark)');

  const convertInputValue = (value) => {
    return ((Number(value) - min) / (max - min)) * 100;
  };

  const updateVolumeGradient = useCallback(
    (value) => {
      if (preferedColorSchemeDark) {
        return `linear-gradient(to right, ${volumeDark.track} 0%, ${volumeDark.track} ${value}%, ${volumeDark.offset} ${value}%, ${volumeDark.offset} 100%)`;
      } else {
        return `linear-gradient(to right, ${volumeLight.track} 0%, ${volumeLight.track} ${value}%, ${volumeLight.offset} ${value}%, ${volumeLight.offset} 100%)`;
      }
    },
    [preferedColorSchemeDark]
  );

  const handleInputChange = (event) => {
    const value = convertInputValue(event.target.value);
    inputRef.current.style.background = updateVolumeGradient(value);
  };

  useEffect(() => {
    inputRef.current.style.background = updateVolumeGradient(value);
  }, [value, updateVolumeGradient]);

  return (
    <input
      ref={inputRef}
      onInput={handleInputChange}
      type="range"
      min={min.toString()}
      max={max.toString()}
      value={value}
      onFocus={onFocus}
      className={clsm([
        'w-[110px]',
        'h-[8px]',
        'rounded-full',
        'bg-grey',
        'form-range',
        'appearance-none',
        'dark:bg-white',
        'sm:w-[80px]'
      ])}
      onChange={(e) => handleChange(Number(e.target.value))}
    />
  );
};

InputRange.propTypes = {
  value: PropTypes.number,
  handleChange: PropTypes.func,
  max: PropTypes.number,
  min: PropTypes.number,
  onFocus: PropTypes.func
};

InputRange.defaultProps = {
  value: 100,
  handleChange: noop,
  max: 100,
  min: 0,
  onFocus: noop
};

export default InputRange;
