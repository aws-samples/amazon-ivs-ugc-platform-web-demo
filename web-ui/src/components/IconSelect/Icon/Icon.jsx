import PropTypes from 'prop-types';
import { clsm } from '../../../utils';

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
  const classes = clsm(
    [
      'selectable-icon',
      `type-${type}`,
      size,
      'focus:outline-none',
      'focus:ring-white',
      'focus:ring-2'
    ],
    {
      selected: isSelected,
      hoverable: isHoverable
    }
  );

  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={`Selectable ${name} ${type} icon`}
      aria-pressed={isSelected}
    >
      {type === 'image' && (
        <img src={iconValue} alt={`${name} Icon`} draggable={false} />
      )}
      {type === 'color' && <div className={clsm(['color', iconValue])} />}
      {!isLoading && isSelected && (
        <Checkmark className={clsm(['w-6', 'h-6'])} />
      )}
      {isLoading && <Spinner variant="white" />}
    </button>
  ) : (
    <div className={classes}>
      {type === 'image' && (
        <img src={iconValue} alt={`${name} Icon`} draggable={false} />
      )}
      {type === 'color' && <div className={clsm(['color', iconValue])} />}
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
