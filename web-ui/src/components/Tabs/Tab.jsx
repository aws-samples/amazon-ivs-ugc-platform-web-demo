import { forwardRef, useCallback } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import Button from '../Button';

const Tab = forwardRef(
  ({ isSelected, label, onClick, onKeyDown, panelIndex }, ref) => {
    const { isTouchscreenDevice } = useResponsiveDevice();

    const onClickHandler = useCallback(
      () => onClick(panelIndex),
      [onClick, panelIndex]
    );
    const onKeyDownHandler = useCallback(
      (event) => onKeyDown(event, panelIndex),
      [onKeyDown, panelIndex]
    );

    return (
      <Button
        {...(!isSelected ? { tabIndex: -1 } : {})}
        disableHover={isTouchscreenDevice}
        ariaControls={`tabpanel-${panelIndex}`}
        ariaSelected={isSelected}
        className={clsm([
          'bg-lightMode-gray-tabButton',
          'dark:bg-darkMode-gray-tabButton',
          'dark:focus:bg-darkMode-gray-tabButton',
          'focus:bg-lightMode-gray-tabButton',
          'w-full',
          !isTouchscreenDevice && [
            'hover:bg-lightMode-gray-hover',
            'dark:hover:bg-darkMode-gray-medium-hover'
          ],
          isSelected && [
            'bg-lightMode-gray',
            'dark:bg-darkMode-gray-medium',
            'dark:focus:bg-darkMode-gray-medium',
            'focus:bg-lightMode-gray'
          ]
        ])}
        onClick={onClickHandler}
        onKeyDown={onKeyDownHandler}
        ref={ref}
        role="tab"
        variant="secondary"
      >
        <p className="truncate">{label}</p>
      </Button>
    );
  }
);

Tab.defaultProps = {
  isSelected: false
};

Tab.propTypes = {
  isSelected: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  panelIndex: PropTypes.number.isRequired
};

export default Tab;
