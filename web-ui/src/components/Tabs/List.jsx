import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import Tab from './Tab';

const List = ({ selectedIndex, setSelectedIndex, tabs }) => {
  const tabsArrRef = useRef([]);
  const onTabClickHandler = useCallback(
    (tabIndex) => {
      setSelectedIndex(tabIndex);
    },
    [setSelectedIndex]
  );
  const onTabKeyDownHandler = useCallback(
    (event, tabIndex) => {
      const maxIndex = tabs.length - 1;

      setSelectedIndex((prevSelectedIndex) => {
        let nextSelectedIndex = prevSelectedIndex;

        if (event.key === 'ArrowRight' && tabIndex === maxIndex)
          nextSelectedIndex = 0;
        else if (event.key === 'ArrowRight')
          nextSelectedIndex = prevSelectedIndex + 1;
        else if (event.key === 'ArrowLeft' && tabIndex === 0)
          nextSelectedIndex = maxIndex;
        else if (event.key === 'ArrowLeft')
          nextSelectedIndex = prevSelectedIndex - 1;

        tabsArrRef.current[nextSelectedIndex].focus();

        return nextSelectedIndex;
      });
    },
    [setSelectedIndex, tabs.length]
  );

  return (
    <div
      className={clsm([
        'bg-white',
        'dark:bg-darkMode-gray-dark',
        'flex',
        'justify-center',
        'pb-5',
        'pt-4',
        'px-5',
        'space-x-3',
        'w-full'
      ])}
      role="tablist"
    >
      {tabs.map((tab, index) => (
        <Tab
          isSelected={selectedIndex === index}
          key={tab.label}
          label={tab.label}
          onClick={onTabClickHandler}
          onKeyDown={onTabKeyDownHandler}
          panelIndex={tab.panelIndex}
          ref={(el) => (tabsArrRef.current[index] = el)}
        />
      ))}
    </div>
  );
};

List.propTypes = {
  selectedIndex: PropTypes.number.isRequired,
  setSelectedIndex: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      panelIndex: PropTypes.number.isRequired
    })
  ).isRequired
};

export default List;
