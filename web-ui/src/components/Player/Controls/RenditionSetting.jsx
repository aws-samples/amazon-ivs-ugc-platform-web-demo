import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { Settings as SettingsSvg } from '../../../assets/icons';
import Button from '../../Button';
import useClickAway from '../../../hooks/useClickAway';

const RenditionSetting = ({
  onControlHoverHandler,
  qualities,
  stopPropagAndResetTimeout,
  updateQuality
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [qualitiesContainerPos, setQualitiesContainerPos] = useState(null);
  const qualitiesContainerRef = useRef();
  const settingsButtonRef = useRef();

  const closeQualitiesContainer = useCallback(() => {
    setIsExpanded(false);
  }, []);
  const onPointerDownRenditionSettingHandler = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);
      setIsExpanded((prev) => !prev);
    },
    [stopPropagAndResetTimeout]
  );

  useClickAway(
    [qualitiesContainerRef, settingsButtonRef],
    closeQualitiesContainer
  );

  useLayoutEffect(() => {
    if (isExpanded && qualitiesContainerRef?.current) {
      const {
        height: qualitiesContainerHeight,
        width: qualitiesContainerWidth
      } = qualitiesContainerRef.current.getBoundingClientRect();

      setQualitiesContainerPos({
        top: -qualitiesContainerHeight - 8,
        left: -qualitiesContainerWidth / 2 + 24 // (container width / 2) + (icon width / 2)
      });
    } else {
      setQualitiesContainerPos(null);
    }
  }, [isExpanded]);

  return (
    <div className={clsm(['flex', 'relative'])}>
      <button
        aria-label={`${
          isExpanded ? 'Close' : 'Open'
        } the video quality selector`}
        className={clsm([
          ...CONTROLS_BUTTON_BASE_CLASSES,
          'transition-transform',
          isExpanded && ['rotate-[30deg]', 'border-white']
        ])}
        onBlur={onControlHoverHandler}
        onFocus={onControlHoverHandler}
        onMouseEnter={onControlHoverHandler}
        onMouseLeave={onControlHoverHandler}
        onPointerDown={onPointerDownRenditionSettingHandler}
        ref={settingsButtonRef}
      >
        {<SettingsSvg />}
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
            'rounded-3xl'
          ])}
          ref={qualitiesContainerRef}
          style={
            qualitiesContainerPos && {
              left: `${qualitiesContainerPos.left}px`,
              top: `${qualitiesContainerPos.top}px`
            }
          }
        >
          {qualities.map(({ name }) =>
            name ? (
              <Button
                ariaLabel={`Select the ${name} video quality`}
                key={name}
                onClick={() => updateQuality(name)}
                variant="secondary"
              >
                {name}
              </Button>
            ) : null
          )}
        </div>
      )}
    </div>
  );
};

RenditionSetting.defaultProps = {
  qualities: [{ name: 'Auto' }]
};

RenditionSetting.propTypes = {
  onControlHoverHandler: PropTypes.func.isRequired,
  qualities: PropTypes.arrayOf(PropTypes.object),
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  updateQuality: PropTypes.func.isRequired
};

export default RenditionSetting;
