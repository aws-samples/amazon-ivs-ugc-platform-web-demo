import { useMemo } from 'react';
import Confetti from 'react-confetti';
import PropTypes from 'prop-types';
import resolveConfig from 'tailwindcss/resolveConfig';

import tailwindConfig from '../../../tailwind.config.js';

const resolvedTailwindConfig = resolveConfig(tailwindConfig);
const style = getComputedStyle(document.documentElement);

const Celebration = ({ chatContainerDimensions, shouldRun }) => {
  const profileColors = useMemo(
    () =>
      Object.entries(resolvedTailwindConfig.theme.colors.profile).reduce(
        (acc, [key, value]) => {
          if (key !== 'default') {
            const cssVarValue = style.getPropertyValue(
              `--base-profile-color-${key}`
            );

            return [
              ...acc,
              value.DEFAULT.replace(/var\(--[a-z-]+\)/, cssVarValue)
            ];
          }

          return acc;
        },
        []
      ),
    []
  );

  return chatContainerDimensions ? (
    <Confetti
      {...chatContainerDimensions}
      colors={profileColors}
      numberOfPieces={shouldRun ? 200 : 0}
      initialVelocityY={35}
    />
  ) : null;
};

Celebration.propTypes = {
  chatContainerDimensions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number
  }),
  shouldRun: PropTypes.bool
};

Celebration.defaultProps = {
  chatContainerDimensions: null,
  shouldRun: false
};

export default Celebration;
