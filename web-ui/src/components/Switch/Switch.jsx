import { useState } from 'react';
import PropTypes from 'prop-types';
import SwitchUnstyled from '@mui/base/SwitchUnstyled';

import { clsm, noop } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import SwitchThumb from '../Switch/SwitchThumb';
import useStateWithCallback from '../../hooks/useStateWithCallback';

const Switch = ({ ariaLabel, isDisabled, onChange, initialChecked }) => {
  const [checked, setChecked] = useStateWithCallback(initialChecked);
  const [isFocused, setIsFocused] = useState(false);
  const { isTouchscreenDevice } = useResponsiveDevice();
  const isHoverEnabled = !isTouchscreenDevice && !isDisabled;

  const offSwitchClasses = [
    isHoverEnabled && [
      'group-hover:dark:shadow-darkMode-switchThumb-hover',
      'group-hover:shadow-lightMode-switchThumb-hover'
    ]
  ];

  const onSwitchClasses = [
    'h-6',
    'w-6',
    isHoverEnabled && [
      'group-hover:shadow-[0_0_0_6px]',
      'group-hover:shadow-lightMode-switchThumb-hover',
      'group-hover:dark:shadow-darkMode-switchThumb-hover'
    ]
  ];

  const handleOnChange = () => {
    setChecked(
      (prevState) => !prevState,
      (_, nextState) => onChange(nextState)
    );
  };

  return (
    <SwitchUnstyled
      component="div"
      aria-label={ariaLabel}
      checked={checked}
      disabled={isDisabled}
      onChange={handleOnChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={clsm([
        'flex',
        'shrink-0',
        'group',
        'h-8',
        'inline-block',
        'relative',
        'w-[52px]',
        'min-h-8',
        'min-w-12'
      ])}
      componentsProps={{
        root: {
          className: clsm(['flex', 'items-center', isDisabled && 'opacity-30'])
        },
        input: {
          className: clsm([
            'absolute',
            'check-box',
            'cursor-pointer',
            'h-full',
            'left-0',
            'm-0',
            'opacity-0',
            'top-0',
            'w-full',
            isDisabled && 'cursor-default'
          ])
        },
        track: {
          className: clsm([
            'absolute',
            'bg-lightMode-gray',
            'border-2',
            'border-lightMode-gray-medium',
            'dark:bg-darkMode-gray',
            'dark:border-darkMode-gray-light',
            'flex',
            'focus-visible:border-lightMode-gray-medium',
            'focus-visible:dark:border-darkMode-gray-light',
            'focus-visible:outline-none',
            'h-full',
            'rounded-3xl',
            'w-full',
            checked && [
              'border-none',
              'bg-lightMode-blue',
              'dark:bg-darkMode-blue'
            ]
          ])
        },
        thumb: {
          className: clsm([
            'mx-2',
            !isDisabled && [
              'group-active:w-7',
              'group-active:h-7',
              'group-active:mx-0.5'
            ],
            'bg-black',
            'block',
            'dark:bg-white',
            'h-4',
            'outline-0',
            'relative',
            'rounded-full',
            'transition-all',
            'w-4',
            isHoverEnabled && 'group-hover:shadow-[0_0_0_8px]',
            checked ? onSwitchClasses : offSwitchClasses,
            isDisabled && 'group-hover:shadow-none'
          ]),
          shouldShowFocusState: isFocused && isHoverEnabled
        }
      }}
      components={{ Thumb: SwitchThumb }}
    />
  );
};

Switch.defaultProps = {
  ariaLabel: '',
  initialChecked: false,
  isDisabled: false,
  onChange: noop
};

Switch.propTypes = {
  ariaLabel: PropTypes.string,
  initialChecked: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onChange: PropTypes.func
};

export default Switch;
