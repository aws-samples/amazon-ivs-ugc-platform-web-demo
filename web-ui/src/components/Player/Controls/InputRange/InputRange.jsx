import { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import './InputRange.css';
import { clsm, noop } from '../../../../utils';
import useMediaQuery from '../../../../hooks/useMediaQuery';

const volumeDark = {
  track: 'var(--palette-color-white)',
  offset: 'var(--palette-color-light-gray)'
};
const volumeLight = {
  track: 'var(--palette-color-black)',
  offset: 'var(--palette-color-gray)'
};

const InputRange = ({ value, updateVolume, max, min }) => {
  const inputRef = useRef(null);
  const prefersColorSchemeDark = useMediaQuery('(prefers-color-scheme: dark)');

  const updateVolumeGradient = useCallback(
    (value) => {
      if (prefersColorSchemeDark) {
        return `linear-gradient(to right, ${volumeDark.track} 0%, ${volumeDark.track} ${value}%, ${volumeDark.offset} ${value}%, ${volumeDark.offset} 100%)`;
      } else {
        return `linear-gradient(to right, ${volumeLight.track} 0%, ${volumeLight.track} ${value}%, ${volumeLight.offset} ${value}%, ${volumeLight.offset} 100%)`;
      }
    },
    [prefersColorSchemeDark]
  );

  const handleInputChange = useCallback(
    (event) => updateVolume(Number(event.target.value)),
    [updateVolume]
  );

  useEffect(() => {
    inputRef.current.style.background = updateVolumeGradient(value);
  }, [value, updateVolumeGradient]);

  return (
    <input
      className={clsm([
        'appearance-none',
        'bg-grey',
        'dark:bg-white',
        'form-range',
        'h-[8px]',
        'rounded-full',
        'sm:w-[80px]',
        'w-[110px]'
      ])}
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
  max: PropTypes.number,
  min: PropTypes.number,
  updateVolume: PropTypes.func,
  value: PropTypes.number
};

InputRange.defaultProps = {
  max: 100,
  min: 0,
  updateVolume: noop,
  value: 100
};

export default InputRange;
