import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import Tooltip from '../../../../components/Tooltip';

const ACTIVE_BUTTON_COLORS = [
  'bg-darkMode-blue',
  'dark:bg-darkMode-blue',
  'dark:hover:bg-darkMode-blue-hover',
  'focus:bg-darkMode-blue',
  'focus:dark:bg-darkMode-blue',
  'hover:bg-lightMode-blue-hover',
  '[&>svg]:fill-white'
];
const INACTIVE_BUTTON_COLORS = [
  'bg-darkMode-red',
  'dark:bg-darkMode-red',
  'dark:hover:bg-darkMode-red-hover',
  'focus:bg-darkMode-red',
  'focus:dark:bg-darkMode-red',
  'hover:bg-lightMode-red-hover',
  '[&>svg]:fill-white'
];

const WebBroadcastControl = forwardRef(({ buttons, isOpen }, ref) => {
  const { isDesktopView, isTouchscreenDevice } = useResponsiveDevice();

  return (
    <div
      className={clsm([
        'flex',
        'justify-center',
        'mt-5',
        'mb-5',
        isOpen || !isDesktopView ? 'space-x-5' : 'space-x-3'
      ])}
    >
      {buttons
        .filter(({ isVisible = true }) => isVisible)
        .map(
          (
            {
              ariaLabel,
              icon,
              isActive,
              isDeviceControl = false,
              isDisabled = false,
              onClick,
              tooltip,
              withRef = undefined
            },
            i
          ) => (
            <Tooltip
              key={`wb-control-tooltip-${tooltip}-${i}`}
              position="above"
              translate={{ y: 2 }}
              message={!isDisabled && tooltip}
            >
              <Button
                ariaLabel={ariaLabel}
                key={`wb-control-btn-${tooltip}-${i}`}
                ref={withRef && ref}
                variant="icon"
                onClick={onClick}
                isDisabled={isDisabled}
                disableHover={isTouchscreenDevice}
                className={clsm([
                  'w-11',
                  'h-11',
                  'dark:[&>svg]:fill-white',
                  '[&>svg]:fill-black',
                  'dark:bg-darkMode-gray-medium',
                  'hover:bg-lightMode-gray-hover',
                  'dark:focus:bg-darkMode-gray-medium',
                  'bg-lightMode-gray',
                  isDeviceControl &&
                    !isActive && [
                      INACTIVE_BUTTON_COLORS,
                      isTouchscreenDevice && [
                        'hover:bg-darkMode-red',
                        'dark:hover:dark:bg-darkMode-red'
                      ]
                    ],
                  !isDeviceControl &&
                    isActive && [
                      ACTIVE_BUTTON_COLORS,
                      isTouchscreenDevice && [
                        'hover:bg-darkMode-blue',
                        'dark:hover:bg-darkMode-blue'
                      ]
                    ],
                  isTouchscreenDevice && ['dark:hover:bg-darkMode-gray-medium']
                ])}
              >
                {icon}
              </Button>
            </Tooltip>
          )
        )}
    </div>
  );
});

WebBroadcastControl.propTypes = {
  buttons: PropTypes.array.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default WebBroadcastControl;
