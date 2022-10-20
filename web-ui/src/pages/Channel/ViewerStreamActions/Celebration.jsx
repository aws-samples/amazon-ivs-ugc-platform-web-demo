import { AnimatePresence, m } from 'framer-motion';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import PropTypes from 'prop-types';
import resolveConfig from 'tailwindcss/resolveConfig';

import {
  defaultViewerStreamActionAnimationProps,
  reversedViewerStreamActionVariants
} from './viewerStreamActionsTheme.js';
import { clsm, range } from '../../../utils';
import { ConfettiClosed, ConfettiOpen } from '../../../assets/icons';
import { PROFILE_COLORS } from '../../../constants';
import tailwindConfig from '../../../tailwind.config';

const resolvedTailwindConfig = resolveConfig(tailwindConfig);
const style = getComputedStyle(document.documentElement);
const creatorGradientTransition = {
  duration: 2,
  ease: 'linear',
  repeat: Infinity,
  type: 'tween'
};

const Celebration = ({ chatContainerDimensions, color, shouldRun }) => {
  const [isIconOpen, setIsIconOpen] = useState(false);
  const animationIntervalIdRef = useRef();
  const profileColors = useMemo(
    () =>
      Object.entries(resolvedTailwindConfig.theme.colors.profile).reduce(
        (acc, [key, value]) => {
          if (key !== 'default') {
            const cssVarValue = style.getPropertyValue(
              `--base-profile-color-${key}`
            );

            return {
              ...acc,
              [key]: value.DEFAULT.replace(/var\(--[a-z-]+\)/, cssVarValue)
            };
          }

          return acc;
        },
        {}
      ),
    []
  );
  const creatorGradientSteps = useMemo(
    () =>
      `${profileColors.salmon} 0deg, ${profileColors.yellow} 54.38deg, ${profileColors.green} 110.62deg, ${profileColors.turquoise} 166.87deg, ${profileColors.blue} 223.13deg, ${profileColors.purple} 277.5deg, ${profileColors.lavender} 331.88deg, ${profileColors.salmon} 360deg`,
    [profileColors]
  );

  useEffect(() => {
    const clearAnimationIntervalId = () => {
      clearInterval(animationIntervalIdRef.current);
      animationIntervalIdRef.current = null;
    };

    if (shouldRun) {
      animationIntervalIdRef.current = setInterval(
        () => setIsIconOpen((prev) => !prev),
        500
      );
    } else {
      setIsIconOpen(false);
      clearAnimationIntervalId();
    }

    return clearAnimationIntervalId;
  }, [shouldRun]);

  return (
    <>
      <AnimatePresence>
        {shouldRun && (
          <m.div
            {...defaultViewerStreamActionAnimationProps}
            animate={[
              defaultViewerStreamActionAnimationProps.animate,
              'endCreatorGradient'
            ]}
            initial={[
              defaultViewerStreamActionAnimationProps.initial,
              'startCreatorGradient'
            ]}
            variants={{
              ...reversedViewerStreamActionVariants,
              startCreatorGradient: {
                backgroundImage: `conic-gradient(from 0deg at 50% 50%, ${creatorGradientSteps})`,
                transition: creatorGradientTransition
              },
              endCreatorGradient: {
                backgroundImage: `conic-gradient(from 360deg at 50% 50%, ${creatorGradientSteps})`,
                transition: creatorGradientTransition
              }
            }}
            className={clsm([
              'absolute',
              'left-5',
              'overflow-hidden',
              'rounded-xl',
              'top-5',
              'w-[calc(100%_-_40px)]',
              'z-20'
            ])}
          >
            <div
              className={clsm([
                'flex',
                'items-center',
                'justify-center',
                'm-1',
                'py-5',
                'relative',
                'rounded-lg',
                'space-x-4',
                `bg-profile-${color}`
              ])}
            >
              {range(5).map((index) => (
                <Fragment key={`confetti-icon-${index}`}>
                  {isIconOpen ? <ConfettiOpen /> : <ConfettiClosed />}
                </Fragment>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
      {chatContainerDimensions ? (
        <Confetti
          {...chatContainerDimensions}
          colors={Object.values(profileColors)}
          numberOfPieces={shouldRun ? 200 : 0}
          initialVelocityY={35}
        />
      ) : null}
    </>
  );
};

Celebration.propTypes = {
  chatContainerDimensions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  color: PropTypes.oneOf([...PROFILE_COLORS, 'default']),
  shouldRun: PropTypes.bool
};

Celebration.defaultProps = {
  chatContainerDimensions: null,
  color: 'default',
  shouldRun: false
};

export default Celebration;
