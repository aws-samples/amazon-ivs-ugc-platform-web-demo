import PropTypes from 'prop-types';

import { dashboard as $dashboardContent } from '../../../../../../content';
import { ZOOM_LEVELS } from '../../../../../../contexts/SynchronizedCharts';
import './ZoomButtons.css';

const $content = $dashboardContent.stream_session_page.charts;

const ZoomButtons = ({ handleSelectZoom, isEnabled, selectedZoomLevel }) => (
  <span className="preset-zoom-buttons">
    <button
      {...(isEnabled && selectedZoomLevel === ZOOM_LEVELS.ALL
        ? { className: 'selected' }
        : {})}
      aria-label="Show all of the data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '36px' }}
      type="button"
      value={ZOOM_LEVELS.ALL}
    >
      {$content.all}
    </button>
    <button
      {...(isEnabled && selectedZoomLevel === ZOOM_LEVELS.ONE_HOUR
        ? { className: 'selected' }
        : {})}
      aria-label="Show the latest 1 hour of data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '44px' }}
      type="button"
      value={ZOOM_LEVELS.ONE_HOUR}
    >
      {$content.one_hour}
    </button>
    <button
      {...(isEnabled && selectedZoomLevel === ZOOM_LEVELS.THIRTY_MIN
        ? { className: 'selected' }
        : {})}
      aria-label="Show the latest 30 minutes of data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '66px' }}
      type="button"
      value={ZOOM_LEVELS.THIRTY_MIN}
    >
      {$content.thirty_min}
    </button>
    <button
      {...(isEnabled && selectedZoomLevel === ZOOM_LEVELS.FIVE_MIN
        ? { className: 'selected' }
        : {})}
      aria-label="Show the latest 5 minutes of data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '55px' }}
      type="button"
      value={ZOOM_LEVELS.FIVE_MIN}
    >
      {$content.five_min}
    </button>
  </span>
);

ZoomButtons.propTypes = {
  handleSelectZoom: PropTypes.func.isRequired,
  isEnabled: PropTypes.bool,
  selectedZoomLevel: PropTypes.oneOf(Object.values(ZOOM_LEVELS)).isRequired
};

ZoomButtons.defaultProps = {
  isEnabled: false
};

export default ZoomButtons;
