import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  useEffect
} from 'react';
import PropTypes from 'prop-types';

import {
  VolumeHigh as VolumeHighSvg,
  VolumeMedium as VolumeMediumSvg,
  VolumeLow as VolumeLowSvg
} from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { usePlayerContext } from '../../contexts/Player';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { VOLUME_MEDIAN, VOLUME_MAX, VOLUME_MIN } from '../../../../constants';
import InputRange from '../../../../components/InputRange';
import useClickAway from '../../../../hooks/useClickAway';

const MOBILE_INPUT_RANGE_HEIGHT = 112;
export const POPUP_ID = 'volume';

const VolumeSetting = ({
  className,
  isDisabled,
  isExpanded,
  setOpenPopupIds,
  updateVolume,
  volumeLevel
}) => {
  const [muted, setMuted] = useState(volumeLevel === VOLUME_MIN);
  const [volume, setVolume] = useState(volumeLevel);
  const [volumeContainerPos, setVolumeContainerPos] = useState(null);
  const { subscribeOverlayElement, stopPropagAndResetTimeout } =
    usePlayerContext();
  const settingsButtonRef = useRef();
  const volumeContainerRef = useRef();

  const { isTouchscreenDevice } = useResponsiveDevice();

  const subscribeOverlayControl = useCallback(
    (element) => {
      subscribeOverlayElement(element);
      settingsButtonRef.current = element;
    },
    [subscribeOverlayElement]
  );

  const closeVolumeContainer = useCallback(() => {
    setOpenPopupIds((prev) => {
      if (prev.includes(POPUP_ID)) return prev.filter((id) => id !== POPUP_ID);

      return prev;
    });
  }, [setOpenPopupIds]);

  const volumeSettingHandler = useCallback(
    (event) => {
      if (!isTouchscreenDevice) {
        stopPropagAndResetTimeout(event);
        setOpenPopupIds((prev) => {
          if (!prev.includes(POPUP_ID)) return [...prev, POPUP_ID];
          if (event.type !== 'mouseleave') return prev;
          return prev.filter((id) => id !== POPUP_ID);
        });
      }
    },
    [isTouchscreenDevice, setOpenPopupIds, stopPropagAndResetTimeout]
  );

  useClickAway([volumeContainerRef, settingsButtonRef], closeVolumeContainer);

  useLayoutEffect(() => {
    if (isExpanded && volumeContainerRef?.current) {
      const { height: volumeContainerHeight, width: volumeContainerWidth } =
        volumeContainerRef.current.getBoundingClientRect();
      const isMobileView = volumeContainerHeight <= MOBILE_INPUT_RANGE_HEIGHT;

      const topPos = isMobileView ? -volumeContainerHeight + 25 : 31;
      const leftPos = isMobileView
        ? -volumeContainerWidth / 2 - 12
        : -volumeContainerWidth / 2 - 27;

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

  /*
   * Toggling the mute button will initiate a state change in the volume level,
   * resulting in it being set to either the minimum volume or the value of the previous volume level.
   */

  const toggleMute = useCallback(
    (event) => {
      setMuted((prevState) => !prevState);
      updateVolume((muted && volume) || VOLUME_MIN);
      stopPropagAndResetTimeout(event);
    },
    [muted, stopPropagAndResetTimeout, updateVolume, volume]
  );

  useEffect(() => {
    if (volumeLevel !== VOLUME_MIN) {
      setVolume(volumeLevel);
    }
  }, [volumeLevel]);

  return (
    <div
      className={clsm(['flex', 'relative', 'items-center'])}
      onMouseEnter={volumeSettingHandler}
      onMouseLeave={volumeSettingHandler}
    >
      <div className={isExpanded && clsm(['flex', 'h-[178px]', 'items-end'])}>
        <button
          aria-label={`${
            isExpanded ? 'Close' : 'Open'
          } the video volume selector`}
          className={clsm([
            ...CONTROLS_BUTTON_BASE_CLASSES,
            'transition-transform',
            isExpanded && 'border-white',
            className,
            'h-12'
          ])}
          disabled={isDisabled}
          onClick={toggleMute}
          onFocus={volumeSettingHandler}
          ref={subscribeOverlayControl}
        >
          {getVolumeSVG()}
        </button>
      </div>
      {isExpanded && (
        <div
          className={clsm([
            '-rotate-90',
            'absolute',
            'bg-lightMode-gray-light',
            'dark:bg-darkMode-gray',
            'flex-col',
            'flex',
            'focus-within:outline-2',
            'focus-within:outline-white',
            'focus-within:outline',
            'p-4',
            'rounded-3xl',
            'space-y-2'
          ])}
          id="volume-range-container"
          onBlur={closeVolumeContainer}
          ref={volumeContainerRef}
          style={
            volumeContainerPos && {
              left: `${volumeContainerPos.left}px`,
              top: `${volumeContainerPos.top}px`
            }
          }
        >
          <InputRange
            max={VOLUME_MAX}
            min={VOLUME_MIN}
            onChange={updateVolume}
            value={volumeLevel}
          />
        </div>
      )}
    </div>
  );
};

VolumeSetting.defaultProps = {
  className: '',
  isDisabled: false,
  isExpanded: false,
  volumeLevel: VOLUME_MAX
};

VolumeSetting.propTypes = {
  className: PropTypes.string,
  isDisabled: PropTypes.bool,
  isExpanded: PropTypes.bool,
  setOpenPopupIds: PropTypes.func.isRequired,
  updateVolume: PropTypes.func.isRequired,
  volumeLevel: PropTypes.number
};

export default VolumeSetting;
