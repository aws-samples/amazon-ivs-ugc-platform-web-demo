import PropTypes from 'prop-types';

import { Checkmark } from '../../../assets/icons';
import './Icon.css';

const Icon = ({
  iconValue,
  name,
  type,
  size,
  onClick,
  selected,
  hoverable
}) => {
  const classes = ['icon'];
  classes.push(size);
  if (selected) classes.push('selected');
  if (hoverable) classes.push('hoverable');
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={classes.join(' ')}
      aria-label={`Selectable ${name} ${type} icon`}
      aria-pressed={selected}
    >
      {selected && <Checkmark />}
      {type === 'image' && (
        <img
          src={iconValue}
          alt={`${name} Icon`}
          draggable={false}
        />
      )}
      {
        type === 'color' && (
          <div className="color" style={{ backgroundColor: iconValue }} />
        )
      }
    </button>
  ) : (
    <div className={classes.join(' ')}>
      {type === 'image' && (
        <img
          src={iconValue}
          alt={`${name} Icon`}
          draggable={false}
        />
      )}
      {
        type === 'color' && (
          <div className="color" style={{ backgroundColor: iconValue}} />
        )
      }
    </div>
  );
};

Icon.propTypes = {
  iconValue: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['image', 'color']),
  name: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'auto']),
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  hoverable: PropTypes.bool
};

Icon.defaultProps = {
  name: '',
  type: 'image',
  iconValue: '',
  size: 'auto',
  onClick: null,
  selected: false,
  hoverable: false
};

export default Icon;