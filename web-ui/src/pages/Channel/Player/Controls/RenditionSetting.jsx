import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import { Close, Settings as SettingsSvg } from '../../../../assets/icons';
import { clsm } from '../../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { createAnimationProps } from '../../../../helpers/animationPropsHelper';
import { player as $content } from '../../../../content';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import useClickAway from '../../../../hooks/useClickAway';

export const POPUP_ID = 'rendition';

const RenditionSetting = ({
  className,
  controlsVisibilityProps,
  isDisabled,
  isExpanded,
  qualities,
  selectedQualityName,
  setOpenPopupIds,
  stopPropagAndResetTimeout,
  updateQuality
}) => {
  const [qualitiesContainerPos, setQualitiesContainerPos] = useState(null);
  const qualitiesContainerRef = useRef();
  const settingsButtonRef = useRef();
  const { isMobileView } = useResponsiveDevice();

  const closeQualitiesContainer = useCallback(() => {
    setOpenPopupIds((prev) => {
      if (prev.includes(POPUP_ID)) return prev.filter((id) => id !== POPUP_ID);

      return prev;
    });
  }, [setOpenPopupIds]);

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

  const onSelectQualityHandler = useCallback(
    (event) => {
      const { name } = event.target;

      if (name) {
        updateQuality(name);
        closeQualitiesContainer();
      }
    },
    [closeQualitiesContainer, updateQuality]
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
  }, [isExpanded, qualities]);

  useEffect(() => {
    closeQualitiesContainer();
  }, [closeQualitiesContainer, isMobileView]);

  return (
    <div className={clsm(['flex', 'relative'])}>
      <button
        {...controlsVisibilityProps}
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
        ref={settingsButtonRef}
      >
        {<SettingsSvg />}
      </button>
      <AnimatePresence>
        {isExpanded && isMobileView && (
          <motion.div
            className={clsm([
              'bg-modalOverlay',
              'fixed',
              'h-screen',
              'left-0',
              'top-0',
              'w-screen'
            ])}
            {...createAnimationProps({ animations: ['fadeIn-full'] })}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={clsm([
              'absolute',
              'bg-lightMode-gray-light',
              'dark:bg-darkMode-gray',
              'flex-col',
              'flex',
              'p-4',
              'rounded-3xl',
              isMobileView && [
                'bottom-0',
                'fixed',
                'left-0',
                'max-h-[65%]',
                'rounded-b-none',
                'w-screen'
              ]
            ])}
            id="rendition-selector-container"
            ref={qualitiesContainerRef}
            style={
              !isMobileView &&
              qualitiesContainerPos && {
                left: `${qualitiesContainerPos.left}px`,
                top: `${qualitiesContainerPos.top}px`
              }
            }
            {...createAnimationProps({
              animations: ['slideIn-bottom'],
              options: { shouldAnimate: isMobileView }
            })}
          >
            {isMobileView && (
              <div className={clsm(['relative'])}>
                <p
                  className={clsm(['text-center', 'font-bold', 'pt-3', 'pb-4'])}
                >
                  {$content.video_quality}
                </p>
                <Button
                  className={clsm([
                    'absolute',
                    'top-0',
                    'right-0',
                    'text-lightMode-gray',
                    '[&>svg]:h-6',
                    '[&>svg]:w-6'
                  ])}
                  onClick={closeQualitiesContainer}
                  variant="icon"
                >
                  <Close />
                </Button>
              </div>
            )}
            <div
              className={clsm([
                'flex',
                'flex-col',
                'space-y-2',
                'overflow-y-auto',
                isMobileView && [
                  'border-lightMode-gray-light-hover',
                  'border-t',
                  'dark:border-darkMode-gray-hover',
                  'pt-4',
                  'dark:scrollbar-color-darkMode-gray-medium'
                ]
              ])}
            >
              {qualities.map(({ name }) =>
                name ? (
                  <Button
                    ariaLabel={`Select the ${name} video quality`}
                    className={clsm([
                      selectedQualityName === name
                        ? [
                            'bg-lightMode-gray-light-hover',
                            'dark:bg-darkMode-gray-hover',
                            'dark:!shadow-white',
                            '!shadow-black',
                            'shadow-focus'
                          ]
                        : [
                            '[&:focus]:[&]:text-black',
                            '[&:focus]:font-bold',
                            '[&:hover]:[&]:text-black',
                            '[&:hover]:font-bold',
                            '[&]:text-lightMode-gray-medium',
                            'dark:[&:focus]:[&]:text-white',
                            'dark:[&:hover]:[&]:text-white',
                            'dark:[&]:text-darkMode-gray-light',
                            'font-normal',
                            'transition-none'
                          ]
                    ])}
                    key={name}
                    name={name}
                    onClick={onSelectQualityHandler}
                    variant="secondaryText"
                  >
                    {name}
                  </Button>
                ) : null
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  controlsVisibilityProps: PropTypes.object.isRequired,
  isDisabled: PropTypes.bool,
  isExpanded: PropTypes.bool,
  qualities: PropTypes.arrayOf(PropTypes.object),
  selectedQualityName: PropTypes.string.isRequired,
  setOpenPopupIds: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  updateQuality: PropTypes.func.isRequired
};

export default RenditionSetting;
