import { motion } from 'framer-motion';
import { useCallback, useLayoutEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Close } from '../../../../../assets/icons';
import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../helpers/animationPropsHelper';
import { player as $content } from '../../../../../content';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import Button from '../../../../../components/Button';
import useClickAway from '../../../../../hooks/useClickAway';
import { usePlayerContext } from '../../../contexts/Player';

export const POPUP_ID = 'rendition';

const RenditionSettingPopup = ({
  closeQualitiesContainer,
  isOpen,
  qualities,
  selectedQualityName,
  settingsButtonRef,
  updateQuality
}) => {
  const [qualitiesContainerPos, setQualitiesContainerPos] = useState(null);
  const { isMobileView } = useResponsiveDevice();
  const { qualitiesContainerRef } = usePlayerContext();

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
    if (isOpen && qualitiesContainerRef?.current) {
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
  }, [isOpen, qualities, qualitiesContainerRef]);

  return (
    <>
      {isMobileView && (
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
          <div className="relative">
            <p className={clsm(['text-center', 'font-bold', 'pt-3', 'pb-4'])}>
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
            !isMobileView && 'max-w-[110px]',
            isMobileView && [
              'border-lightMode-gray-light-hover',
              'border-t',
              'dark:border-darkMode-gray-hover',
              'pt-4',
              'dark:scrollbar-color-darkMode-gray-medium'
            ]
          ])}
        >
          {qualities
            .filter(({ name }) => name !== 'audio_only')
            .map(({ name }) =>
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
    </>
  );
};

RenditionSettingPopup.propTypes = {
  closeQualitiesContainer: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  qualities: PropTypes.arrayOf(PropTypes.object),
  selectedQualityName: PropTypes.string.isRequired,
  settingsButtonRef: PropTypes.shape({ current: PropTypes.object }),
  updateQuality: PropTypes.func.isRequired
};

RenditionSettingPopup.defaultProps = {
  isOpen: false,
  qualities: [{ name: 'Auto' }],
  settingsButtonRef: { current: null }
};

export default RenditionSettingPopup;
