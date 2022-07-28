import PropTypes from 'prop-types';
import { useState } from 'react';

import Icon from './Icon';
import './IconSelect.css';

const IconSelect = ({
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
    onClick(iconSrcName, (savedIconSrcName) => setSelectedIcon(savedIconSrcName));
  }
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
            {Object.keys(items).map((iconName) => (
              <Icon
                iconValue={items[iconName]}
                type={type}
                name={iconName}
                hoverable
                selected={selectedIcon === iconName}
                key={iconName}
                onClick={() => handleOnClickEvent(iconName)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
};

IconSelect.defaultProps = {
  name: '',
  label: '',
  type: 'image',
  selected: '',
  onClick: () => {},
  variant: 'vertical'
}

IconSelect.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  type: PropTypes.oneOf(['image', 'color']),
  items: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['vertical', 'horizontal'])
}

export default IconSelect;