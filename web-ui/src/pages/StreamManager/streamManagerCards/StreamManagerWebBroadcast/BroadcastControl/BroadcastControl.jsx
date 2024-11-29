import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { useSelector } from 'react-redux';

import { clsm } from '../../../../../utils';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Button from '../../../../../components/Button';
import Tooltip from '../../../../../components/Tooltip';
import { CONTROLLER_BUTTON_THEME } from './BroadcastControllerTheme';
import { BREAKPOINTS, PARTICIPANT_TYPES } from '../../../../../constants';

const ACTIVE_BUTTON_COLORS = [
  'bg-darkMode-blue',
  'dark:bg-darkMode-blue',
  'dark:hover:bg-darkMode-blue-hover',
  'focus:bg-darkMode-blue',
  'focus:dark:bg-darkMode-blue',
  'hover:bg-lightMode-blue-hover',
  '[&>svg]:fill-white'
];

const BroadcastControl = forwardRef(({ buttons, isOpen }, ref) => {
  const { fullscreen } = useSelector((state) => state.streamManager);
  const { collaborate } = useSelector((state) => state.shared);
  const { isDesktopView, isTouchscreenDevice, currentBreakpoint, dimensions } =
    useResponsiveDevice();
  const isHost = collaborate.participantType === PARTICIPANT_TYPES.HOST;

  const getSpaceBetween = () => {
    if (fullscreen.isOpen) {
      return (isHost && dimensions?.width < 375) ||
        currentBreakpoint === BREAKPOINTS.xxs
        ? ['space-x-1']
        : ['space-x-4'];
    }
    return isOpen || !isDesktopView
      ? ['space-x-4', 'xs:space-x-2']
      : 'space-x-3';
  };

  return (
    <div
      className={clsm([
        'flex',
        'justify-center',
        'mt-5',
        'mb-5',
        getSpaceBetween()
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
                  !isTouchscreenDevice && [
                    'hover:bg-lightMode-gray-hover',
                    'dark:hover:bg-darkMode-gray-hover'
                  ],
                  CONTROLLER_BUTTON_THEME,
                  !isDeviceControl &&
                    isActive && [
                      ACTIVE_BUTTON_COLORS,
                      isTouchscreenDevice && [
                        'hover:bg-darkMode-blue',
                        'dark:hover:bg-darkMode-blue'
                      ]
                    ]
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

BroadcastControl.propTypes = {
  buttons: PropTypes.array.isRequired,
  isOpen: PropTypes.bool.isRequired
};

export default BroadcastControl;
