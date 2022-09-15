import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { streamManager as $streamManagerContent } from '../../../content';

const $content = $streamManagerContent.status_bar;
const HEALTH = { STABLE: $content.stable, POOR: $content.poor };

const HealthIndicator = ({ health }) => {
  let color = ['bg-lightMode-gray', 'dark:bg-darkMode-gray']; // unknown stream health
  if (health === HEALTH.STABLE) color = 'bg-darkMode-green';
  if (health === HEALTH.POOR) color = 'bg-darkMode-red';

  return (
    <span
      className={clsm(
        ['inline-block', 'w-2.5', 'h-2.5', 'rounded-full'],
        color
      )}
    />
  );
};

HealthIndicator.propTypes = { health: PropTypes.string.isRequired };

export default HealthIndicator;
