import PropTypes from 'prop-types';
import { useState } from 'react';

import Icon from './Icon';
import './IconSelect.css';

const IconSelect = ({
  isLoading,
  name,
  label,
  type,
  items,
  selected,
  onClick,
  variant
}) => {
  const [selectedIcon, setSelectedIcon] = useState(selected);
  const handleOnClickEvent = (iconSrcName) => {
    // Eagerly set the selected icon
    setSelectedIcon(iconSrcName);

    onClick(iconSrcName, (nextIconSrcName) => setSelectedIcon(nextIconSrcName));
  };

  return (
    <div className={`outer-select-container ${variant}`}>
      {label && (
        <label className="label h4" htmlFor={name}>
          {label}
        </label>
      )}
      <div
        id={`${name}-icon-select-container`}
        className={'inner-select-container'}
      >
        <div className="select-item-container">
          <div className="select-items">
            {Object.keys(items).map((iconName) => {
              const isSelected = selectedIcon === iconName;

              return (
                <Icon
                  iconValue={items[iconName]}
                  isHoverable
                  isLoading={isSelected && isLoading}
                  isSelected={isSelected}
                  type={type}
                  name={iconName}
                  key={iconName}
                  onClick={() => handleOnClickEvent(iconName)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

IconSelect.defaultProps = {
  isLoading: false,
  name: '',
  label: '',
  type: 'image',
  selected: '',
  onClick: () => {},
  variant: 'vertical'
};

IconSelect.propTypes = {
  isLoading: PropTypes.bool,
  name: PropTypes.string,
  label: PropTypes.string,
  type: PropTypes.oneOf(['image', 'color']),
  items: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['vertical', 'horizontal'])
};

export default IconSelect;
