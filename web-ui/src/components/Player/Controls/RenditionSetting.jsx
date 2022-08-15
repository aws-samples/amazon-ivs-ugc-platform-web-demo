import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { m, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { CONTROLS_BUTTON_BASE_CLASSES } from './ControlsTheme';
import { player as $content } from '../../../content';
import { Close, Settings as SettingsSvg } from '../../../assets/icons';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import Button from '../../Button';
import useClickAway from '../../../hooks/useClickAway';

const defaultTransition = { duration: 0.25, type: 'tween' };

const RenditionSetting = ({
  onControlHoverHandler,
  qualities,
  selectedQualityName,
  setIsPopupOpen,
  stopPropagAndResetTimeout,
  updateQuality
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [qualitiesContainerPos, setQualitiesContainerPos] = useState(null);
  const qualitiesContainerRef = useRef();
  const settingsButtonRef = useRef();
  const { isMobileView } = useMobileBreakpoint();

  const closeQualitiesContainer = useCallback(() => {
    setIsExpanded(false);
    setIsPopupOpen(false);
  }, [setIsPopupOpen]);
  const onPointerDownRenditionSettingHandler = useCallback(
    (event) => {
      stopPropagAndResetTimeout(event);
      setIsExpanded((prev) => {
        setIsPopupOpen(!prev);

        return !prev;
      });
    },
    [setIsPopupOpen, stopPropagAndResetTimeout]
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
  }, [isExpanded]);

  useEffect(() => {
    closeQualitiesContainer();
  }, [closeQualitiesContainer, isMobileView, qualities]);

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
      <AnimatePresence>
        {isExpanded && isMobileView && (
          <m.div
            className={clsm([
              'bg-modalOverlay',
              'fixed',
              'h-screen',
              'left-0',
              'top-0',
              'w-screen'
            ])}
            animate="visible"
            exit="hidden"
            initial="hidden"
            transition={defaultTransition}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          ></m.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isExpanded && (
          <m.div
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
                'z-40',
                'w-screen'
              ]
            ])}
            ref={qualitiesContainerRef}
            style={
              !isMobileView &&
              qualitiesContainerPos && {
                left: `${qualitiesContainerPos.left}px`,
                top: `${qualitiesContainerPos.top}px`
              }
            }
            animate="visible"
            exit="hidden"
            initial="hidden"
            transition={defaultTransition}
            variants={
              isMobileView && { hidden: { y: '100%' }, visible: { y: 0 } }
            }
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
                'gap-y-2',
                'overflow-y-auto',
                isMobileView && [
                  'border-lightMode-gray-light-hover',
                  'border-t',
                  'dark:border-darkMode-gray-hover',
                  'pt-4'
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
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

RenditionSetting.defaultProps = {
  qualities: [{ name: 'Auto' }]
};

RenditionSetting.propTypes = {
  onControlHoverHandler: PropTypes.func.isRequired,
  qualities: PropTypes.arrayOf(PropTypes.object),
  selectedQualityName: PropTypes.string.isRequired,
  setIsPopupOpen: PropTypes.func.isRequired,
  stopPropagAndResetTimeout: PropTypes.func.isRequired,
  updateQuality: PropTypes.func.isRequired
};

export default RenditionSetting;
