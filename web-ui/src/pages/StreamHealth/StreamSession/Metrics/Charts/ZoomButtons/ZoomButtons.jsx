import PropTypes from 'prop-types';

import { dashboard as $dashboardContent } from '../../../../../../content';
import { ZOOM_LEVELS } from '../../../../../../contexts/SynchronizedCharts';
import './ZoomButtons.css';

const $content = $dashboardContent.stream_session_page.charts;

const ZoomButtons = ({ handleSelectZoom, isEnabled, selectedZoomLevel }) => {
  const isSelected = (zoomLevel) =>
    isEnabled && selectedZoomLevel === zoomLevel;
  return (
    <span className="preset-zoom-buttons">
      <button
        {...(isSelected(ZOOM_LEVELS.ALL) ? { className: 'selected' } : {})}
        aria-label="Show all of the data"
        aria-pressed={isSelected(ZOOM_LEVELS.ALL)}
        disabled={!isEnabled}
        onClick={handleSelectZoom}
        style={{ width: '36px' }}
        type="button"
        value={ZOOM_LEVELS.ALL}
      >
        {$content.all}
      </button>
      <button
        {...(isSelected(ZOOM_LEVELS.ONE_HOUR) ? { className: 'selected' } : {})}
        aria-label="Show the latest 1 hour of data"
        aria-pressed={isSelected(ZOOM_LEVELS.ONE_HOUR)}
        disabled={!isEnabled}
        onClick={handleSelectZoom}
        style={{ width: '44px' }}
        type="button"
        value={ZOOM_LEVELS.ONE_HOUR}
      >
        {$content.one_hour}
      </button>
      <button
        {...(isSelected(ZOOM_LEVELS.THIRTY_MIN)
          ? { className: 'selected' }
          : {})}
        aria-label="Show the latest 30 minutes of data"
        aria-pressed={isSelected(ZOOM_LEVELS.THIRTY_MIN)}
        disabled={!isEnabled}
        onClick={handleSelectZoom}
        style={{ width: '66px' }}
        type="button"
        value={ZOOM_LEVELS.THIRTY_MIN}
      >
        {$content.thirty_min}
      </button>
      <button
        {...(isSelected(ZOOM_LEVELS.FIVE_MIN) ? { className: 'selected' } : {})}
        aria-label="Show the latest 5 minutes of data"
        aria-pressed={isSelected(ZOOM_LEVELS.FIVE_MIN)}
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
};

ZoomButtons.propTypes = {
  handleSelectZoom: PropTypes.func.isRequired,
  isEnabled: PropTypes.bool,
  selectedZoomLevel: PropTypes.oneOf(Object.values(ZOOM_LEVELS)).isRequired
};

ZoomButtons.defaultProps = {
  isEnabled: false
};

export default ZoomButtons;
