import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from '../ControlsTheme';
import { Settings as SettingsSvg } from '../../../../../assets/icons';
import { usePlayerContext } from '../../../contexts/Player';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import RenditionSettingPopup from './RenditionSettingPopup';
import RenditionSettingPopupPortal from './RenditionSettingPopupPortal';
import useDidChange from '../../../../../hooks/useDidChange';

export const POPUP_ID = 'rendition';

const RenditionSetting = ({
  className,
  isDisabled,
  isExpanded,
  qualities,
  selectedQualityName,
  setOpenPopupIds,
  updateQuality
}) => {
  const { subscribeOverlayElement, stopPropagAndResetTimeout } =
    usePlayerContext();
  const { isMobileView } = useResponsiveDevice();
  const didMobileViewChange = useDidChange(isMobileView);
  const settingsButtonRef = useRef();

  const subscribeOverlayControl = useCallback(
    (element) => {
      subscribeOverlayElement(element);
      settingsButtonRef.current = element;
    },
    [subscribeOverlayElement]
  );

  const onClickRenditionSettingHandler = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);
      setOpenPopupIds((prev) => {
        if (!prev.includes(POPUP_ID)) return [...prev, POPUP_ID];
        else return prev.filter((id) => id !== POPUP_ID);
      });
    },
    [setOpenPopupIds, stopPropagAndResetTimeout]
  );

  const closeQualitiesContainer = useCallback(() => {
    setOpenPopupIds((prev) => {
      if (prev.includes(POPUP_ID)) return prev.filter((id) => id !== POPUP_ID);

      return prev;
    });
  }, [setOpenPopupIds]);

  // Close the rendition setting when switching between mobile and desktop views
  useEffect(() => {
    if (didMobileViewChange) closeQualitiesContainer();
  }, [closeQualitiesContainer, didMobileViewChange]);

  const popupProps = {
    closeQualitiesContainer,
    isOpen: isExpanded,
    qualities,
    updateQuality,
    settingsButtonRef,
    selectedQualityName
  };

  return (
    <div className={clsm(['flex', 'relative'])}>
      <button
        aria-label={`${
          isExpanded ? 'Close' : 'Open'
        } the video quality selector`}
        className={clsm([
          ...CONTROLS_BUTTON_BASE_CLASSES,
          'transition-transform',
          isExpanded && ['rotate-[30deg]', 'border-white'],
          className
        ])}
        disabled={isDisabled}
        onClick={onClickRenditionSettingHandler}
        ref={subscribeOverlayControl}
      >
        <SettingsSvg />
      </button>
      {isMobileView ? (
        <RenditionSettingPopupPortal {...popupProps} />
      ) : (
        isExpanded && <RenditionSettingPopup {...popupProps} />
      )}
    </div>
  );
};

RenditionSetting.defaultProps = {
  isDisabled: false,
  isExpanded: false,
  qualities: [{ name: 'Auto' }],
  className: ''
};

RenditionSetting.propTypes = {
  className: PropTypes.string,
  isDisabled: PropTypes.bool,
  isExpanded: PropTypes.bool,
  qualities: PropTypes.arrayOf(PropTypes.object),
  selectedQualityName: PropTypes.string.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired,
  updateQuality: PropTypes.func.isRequired
};

export default RenditionSetting;
