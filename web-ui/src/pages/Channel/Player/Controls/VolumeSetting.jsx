import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import {
  VolumeHigh as VolumeHighSvg,
  VolumeMedium as VolumeMediumSvg,
  VolumeLow as VolumeLowSvg
} from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { usePlayerContext } from '../../contexts/Player';
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
  const [volumeContainerPos, setVolumeContainerPos] = useState(null);
  const { subscribeOverlayElement, stopPropagAndResetTimeout } =
    usePlayerContext();
  const settingsButtonRef = useRef();
  const volumeContainerRef = useRef();

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

  const onClickVolumeSettingHandler = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);
      setOpenPopupIds((prev) => {
        if (!prev.includes(POPUP_ID)) return [...prev, POPUP_ID];
        else return prev.filter((id) => id !== POPUP_ID);
      });
    },
    [setOpenPopupIds, stopPropagAndResetTimeout]
  );

  useClickAway([volumeContainerRef, settingsButtonRef], closeVolumeContainer);

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

  return (
    <div className={clsm(['flex', 'relative'])}>
      <button
        aria-label={`${
          isExpanded ? 'Close' : 'Open'
        } the video volume selector`}
        className={clsm([
          ...CONTROLS_BUTTON_BASE_CLASSES,
          'transition-transform',
          isExpanded && 'border-white',
          className
        ])}
        disabled={isDisabled}
        onClick={onClickVolumeSettingHandler}
        ref={subscribeOverlayControl}
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
            'space-y-2',
            'p-4',
            'rounded-3xl',
            '-rotate-90'
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
