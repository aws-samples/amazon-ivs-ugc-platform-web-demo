import PropTypes from 'prop-types';

import { dashboard as $dashboardContent } from '../../../../../../content';

const $content = $dashboardContent.stream_session_page.charts;

export const zoomLevels = {
  none: 0,
  all: -1,
  oneHour: 3600,
  thirtyMin: 1800,
  fiveMin: 300
};

const ZoomButtons = ({ handleSelectZoom, isEnabled, selectedZoomLevel }) => (
  <span className="preset-zoom-buttons">
    <button
      {...(isEnabled && selectedZoomLevel === zoomLevels.all
        ? { className: 'selected' }
        : {})}
      aria-label="Show all of the data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '36px' }}
      type="button"
      value={zoomLevels.all}
    >
      {$content.all}
    </button>
    <button
      {...(isEnabled && selectedZoomLevel === zoomLevels.oneHour
        ? { className: 'selected' }
        : {})}
      aria-label="Show the latest 1 hour of data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '44px' }}
      type="button"
      value={zoomLevels.oneHour}
    >
      {$content.one_hour}
    </button>
    <button
      {...(isEnabled && selectedZoomLevel === zoomLevels.thirtyMin
        ? { className: 'selected' }
        : {})}
      aria-label="Show the latest 30 minutes of data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '66px' }}
      type="button"
      value={zoomLevels.thirtyMin}
    >
      {$content.thirty_min}
    </button>
    <button
      {...(isEnabled && selectedZoomLevel === zoomLevels.fiveMin
        ? { className: 'selected' }
        : {})}
      aria-label="Show the latest 5 minutes of data"
      disabled={!isEnabled}
      onClick={handleSelectZoom}
      style={{ width: '55px' }}
      type="button"
      value={zoomLevels.fiveMin}
    >
      {$content.five_min}
    </button>
  </span>
);

ZoomButtons.propTypes = {
  handleSelectZoom: PropTypes.func.isRequired,
  isEnabled: PropTypes.bool,
  selectedZoomLevel: PropTypes.oneOf(Object.values(zoomLevels)).isRequired
};

ZoomButtons.defaultProps = {
  isEnabled: false
};

export default ZoomButtons;
