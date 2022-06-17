import PropTypes from 'prop-types';
import { useState } from 'react';

import { dashboard as $dashboardContent } from '../../../../../../content';

const $content = $dashboardContent.stream_session_page.charts;

const ZoomButtons = ({ isEnabled, updateZoomBounds }) => {
  const [selectedZoomLevel, setSelectedZoomLevel] = useState(-1);

  const handleSelectZoom = ({ target: { value: zoomAmountInSeconds } }) => {
    zoomAmountInSeconds = parseInt(zoomAmountInSeconds, 10);
    updateZoomBounds(zoomAmountInSeconds);
    setSelectedZoomLevel(parseInt(zoomAmountInSeconds));
  };

  return (
    <span className="preset-zoom-buttons">
      <button
        {...(selectedZoomLevel === -1 ? { className: 'selected' } : {})}
        aria-label="Show all of the data"
        disabled={!isEnabled}
        onClick={handleSelectZoom}
        style={{ width: '36px' }}
        type="button"
        value={-1}
      >
        {$content.all}
      </button>
      <button
        {...(selectedZoomLevel === 3600 ? { className: 'selected' } : {})}
        aria-label="Show the latest 1 hour of data"
        disabled={!isEnabled}
        onClick={handleSelectZoom}
        style={{ width: '44px' }}
        type="button"
        value={3600}
      >
        {$content.one_hour}
      </button>
      <button
        {...(selectedZoomLevel === 1800 ? { className: 'selected' } : {})}
        aria-label="Show the latest 30 minutes of data"
        disabled={!isEnabled}
        onClick={handleSelectZoom}
        style={{ width: '66px' }}
        type="button"
        value={1800}
      >
        {$content.thirty_min}
      </button>
      <button
        {...(selectedZoomLevel === 300 ? { className: 'selected' } : {})}
        aria-label="Show the latest 5 minutes of data"
        disabled={!isEnabled}
        onClick={handleSelectZoom}
        style={{ width: '55px' }}
        type="button"
        value={300}
      >
        {$content.five_min}
      </button>
    </span>
  );
};

ZoomButtons.propTypes = {
  isEnabled: PropTypes.bool,
  updateZoomBounds: PropTypes.func.isRequired
};

ZoomButtons.defaultProps = {
  isEnabled: false
};

export default ZoomButtons;
