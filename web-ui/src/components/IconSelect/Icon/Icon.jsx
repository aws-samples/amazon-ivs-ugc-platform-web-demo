import PropTypes from 'prop-types';
import clsx from 'clsx';

import { Checkmark } from '../../../assets/icons';
import Spinner from '../../Spinner';
import './Icon.css';

const Icon = ({
  iconValue,
  isHoverable,
  isLoading,
  isSelected,
  name,
  type,
  size,
  onClick
}) => {
  const classes = clsx(['icon', size], {
    selected: isSelected,
    hoverable: isHoverable
  });

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={`Selectable ${name} ${type} icon`}
      aria-pressed={isSelected}
    >
      {!isLoading && isSelected && <Checkmark />}
      {isLoading && <Spinner variant="white" />}
      {type === 'image' && (
        <img src={iconValue} alt={`${name} Icon`} draggable={false} />
      )}
      {type === 'color' && (
        <div className="color" style={{ backgroundColor: iconValue }} />
      )}
    </button>
  ) : (
    <div className={classes.join(' ')}>
      {type === 'image' && (
        <img src={iconValue} alt={`${name} Icon`} draggable={false} />
      )}
      {type === 'color' && (
        <div className="color" style={{ backgroundColor: iconValue }} />
      )}
    </div>
  );
};

Icon.propTypes = {
  iconValue: PropTypes.string.isRequired,
  isHoverable: PropTypes.bool,
  isLoading: PropTypes.bool,
  isSelected: PropTypes.bool,
  type: PropTypes.oneOf(['image', 'color']),
  name: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'auto']),
  onClick: PropTypes.func
};

Icon.defaultProps = {
  isHoverable: false,
  isLoading: false,
  isSelected: false,
  name: '',
  type: 'image',
  iconValue: '',
  size: 'auto',
  onClick: null
};

export default Icon;
