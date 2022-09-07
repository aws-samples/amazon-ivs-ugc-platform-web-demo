import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useEffect
} from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import useClickAway from '../../../hooks/useClickAway';

import {
  VolumeHigh as VolumeHighSvg,
  VolumeMedium as VolumeMediumSvg,
  VolumeLow as VolumeLowSvg
} from '../../../assets/icons';

import { VOLUME_MEDIAN, VOLUME_MAX, VOLUME_MIN } from '../../../constants';

import InputRange from './InputRange';

const MOBILE_INPUT_RANGE_HEIGHT = 112;

const VolumeSetting = ({
  isDisabled,
  className,
  onControlHoverHandler,
  volumeLevel,
  stopPropagAndResetTimeout,
  updateVolume,
  setIsPopupOpen
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [volumeContainerPos, setVolumeContainerPos] = useState(null);
  const volumeContainerRef = useRef();
  const settingsButtonRef = useRef();

  const closeVolumeContainer = useCallback(() => {
    setIsExpanded(false);
    setIsPopupOpen(false);
  }, [setIsPopupOpen]);

  const onClickRenditionSettingHandler = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);
      setIsExpanded((prev) => !prev);
    },
    [stopPropagAndResetTimeout]
  );

  useClickAway([volumeContainerRef, settingsButtonRef], closeVolumeContainer);

  useEffect(() => {
    setIsPopupOpen(isExpanded);
  }, [isExpanded, setIsPopupOpen]);

  useLayoutEffect(() => {
    if (isExpanded && volumeContainerRef?.current) {
      const { height: volumeContainerHeight, width: volumeContainerWidth } =
        volumeContainerRef.current.getBoundingClientRect();
      const isMobileView = volumeContainerHeight <= MOBILE_INPUT_RANGE_HEIGHT;

      const topPos = isMobileView
        ? -volumeContainerHeight + 25
        : -volumeContainerHeight + 45;
      const leftPos = isMobileView
        ? -volumeContainerWidth / 2 - 12
        : -volumeContainerWidth / 2 - 28; // (container width / 2) + (icon width / 2)

      setVolumeContainerPos({
        top: topPos,
        left: leftPos
      });
    } else {
      setVolumeContainerPos(null);
    }
  }, [isExpanded]);

  const getVolumeSVG = useCallback(() => {
    if (volumeLevel === VOLUME_MIN) {
      return <VolumeLowSvg />;
    } else if (volumeLevel < VOLUME_MEDIAN && volumeLevel < VOLUME_MAX) {
      return <VolumeMediumSvg />;
    } else {
      return <VolumeHighSvg />;
    }
  }, [volumeLevel]);

  return (
    <div className={clsm(['flex', 'relative'])}>
      <button
        aria-label={`${
          isExpanded ? 'Close' : 'Open'
        } the video volume selector`}
        className={clsm([
          ...CONTROLS_BUTTON_BASE_CLASSES,
          'transition-transform',
          className
        ])}
        disabled={isDisabled}
        onBlur={onControlHoverHandler}
        onFocus={onControlHoverHandler}
        onMouseEnter={onControlHoverHandler}
        onMouseLeave={onControlHoverHandler}
        onClick={onClickRenditionSettingHandler}
        ref={settingsButtonRef}
      >
        {getVolumeSVG()}
      </button>
      {isExpanded && (
        <div
          className={clsm([
            'absolute',
            'bg-lightMode-gray-light',
            'dark:bg-darkMode-gray',
            'flex-col',
            'flex',
            'gap-y-2',
            'p-4',
            'rounded-3xl',
            '-rotate-90',
            'z-20'
          ])}
          id="volume-range-container"
          ref={volumeContainerRef}
          style={
            volumeContainerPos && {
              left: `${volumeContainerPos.left}px`,
              top: `${volumeContainerPos.top}px`
            }
          }
        >
          <InputRange
            onFocus={onControlHoverHandler}
            value={volumeLevel}
            handleChange={updateVolume}
            max={VOLUME_MAX}
            min={VOLUME_MIN}
            name={'volume'}
          />
        </div>
      )}
    </div>
  );
};

VolumeSetting.defaultProps = {
  isDisabled: false,
  volumeLevel: VOLUME_MAX,
  className: ''
};

VolumeSetting.propTypes = {
  isDisabled: PropTypes.bool,
  className: PropTypes.string,
  onControlHoverHandler: PropTypes.func.isRequired,
  volumeLevel: PropTypes.number,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  updateVolume: PropTypes.func.isRequired,
  setIsPopupOpen: PropTypes.func.isRequired
};

export default VolumeSetting;
