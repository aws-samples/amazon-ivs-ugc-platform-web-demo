import { useRef, useEffect, useCallback } from 'react';
import { clsm } from '../../utils';
import PropTypes from 'prop-types';
import useMediaQuery from '../../hooks/useMediaQuery';

export const volumeDark = {
  tracked: 'var(--palette-color-white)',
  offset: 'var(--palette-color-light-gray)'
};
export const volumeLight = {
  tracked: 'var(--palette-color-black)',
  offset: 'var(--palette-color-gray)'
};

const InputRange = ({ value, handleChange, max, min }) => {
  const inputRef = useRef(null);
  const preferedColorSchemeDark = useMediaQuery('(prefers-color-scheme: dark)');

  const convertInputValue = (value) => {
    return ((Number(value) - min) / (max - min)) * 100;
  };

  const updateVolumeGradient = useCallback(
    (value) => {
      if (preferedColorSchemeDark) {
        return `linear-gradient(to right, ${volumeDark.tracked} 0%, ${volumeDark.tracked} ${value}%, ${volumeDark.offset} ${value}%, ${volumeDark.offset} 100%)`;
      } else {
        return `linear-gradient(to right, ${volumeLight.tracked} 0%, ${volumeLight.tracked} ${value}%, ${volumeLight.offset} ${value}%, ${volumeLight.offset} 100%)`;
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
  handleChange: PropTypes.func,
  max: PropTypes.number,
  min: PropTypes.number
};

InputRange.defaultProps = {
  value: 100,
  handleChange: () => {},
  max: 100,
  min: 0
};

export default InputRange;
