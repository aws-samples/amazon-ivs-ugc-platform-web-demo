import PropTypes from 'prop-types';

import { clsm } from '../../../../../../utils';
import { dashboard as $dashboardContent } from '../../../../../../content';
import { ZOOM_LEVELS } from '../../../../../../contexts/SynchronizedCharts';

const $content = $dashboardContent.stream_session_page.charts;
const BUTTON_BASE_CLASSES = [
  'bg-transparent',
  'border-none',
  'cursor-pointer',
  'dark:disabled:text-darkMode-gray',
  'dark:focus:bg-darkMode-gray-dark',
  'dark:hover:enabled:bg-darkMode-gray-dark-hover',
  'dark:shadow-white',
  'dark:text-darkMode-gray-light',
  'disabled:cursor-auto',
  'disabled:text-lightMode-gray',
  'flex',
  'focus:bg-lightMode-gray-extraLight',
  'focus:outline-none',
  'focus:shadow-focus',
  'hover:enabled:bg-lightMode-gray-light-hover',
  'items-center',
  'justify-center',
  'leading-[15.73px]',
  'px-2.5',
  'py-1',
  'rounded-3xl',
  'shadow-black',
  'text-lightMode-gray-medium',
  'text-p2'
];
const BUTTON_SELECTED_CLASSES = ['font-bold', 'text-black', 'dark:text-white'];

const ZoomButtons = ({
  handleSelectZoom,
  isEnabled = false,
  selectedZoomLevel
}) => {
  const isSelected = (zoomLevel) =>
    isEnabled && selectedZoomLevel === zoomLevel;
  const defaultButtonProps = {
    disabled: !isEnabled,
    onClick: handleSelectZoom,
    type: 'button'
  };

  return (
    <span className={clsm(['flex', 'space-x-8', 'xs:space-x-4'])}>
      <button
        {...defaultButtonProps}
        aria-label="Show all of the data"
        aria-pressed={isSelected(ZOOM_LEVELS.ALL)}
        className={clsm([
          BUTTON_BASE_CLASSES,
          isSelected(ZOOM_LEVELS.ALL) && BUTTON_SELECTED_CLASSES,
          'w-9'
        ])}
        value={ZOOM_LEVELS.ALL}
      >
        {$content.all}
      </button>
      <button
        {...defaultButtonProps}
        aria-label="Show the latest 1 hour of data"
        aria-pressed={isSelected(ZOOM_LEVELS.ONE_HOUR)}
        className={clsm([
          BUTTON_BASE_CLASSES,
          isSelected(ZOOM_LEVELS.ONE_HOUR) && BUTTON_SELECTED_CLASSES,
          'w-11'
        ])}
        value={ZOOM_LEVELS.ONE_HOUR}
      >
        {$content.one_hour}
      </button>
      <button
        {...defaultButtonProps}
        aria-label="Show the latest 30 minutes of data"
        aria-pressed={isSelected(ZOOM_LEVELS.THIRTY_MIN)}
        className={clsm([
          BUTTON_BASE_CLASSES,
          isSelected(ZOOM_LEVELS.THIRTY_MIN) && BUTTON_SELECTED_CLASSES,
          'w-[66px]'
        ])}
        value={ZOOM_LEVELS.THIRTY_MIN}
      >
        {$content.thirty_min}
      </button>
      <button
        {...defaultButtonProps}
        aria-label="Show the latest 5 minutes of data"
        aria-pressed={isSelected(ZOOM_LEVELS.FIVE_MIN)}
        className={clsm([
          BUTTON_BASE_CLASSES,
          isSelected(ZOOM_LEVELS.FIVE_MIN) && BUTTON_SELECTED_CLASSES,
          'w-14'
        ])}
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

export default ZoomButtons;
