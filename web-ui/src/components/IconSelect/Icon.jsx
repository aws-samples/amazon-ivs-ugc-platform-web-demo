import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { Checkmark } from '../../assets/icons';
import { clsm, noop } from '../../utils';
import { createAnimationProps } from '../../helpers/animationPropsHelper';
import NoImageSrcIcon from './NoImageSrcIcon';
import Spinner from '../Spinner';

export const ICON_TYPE = { IMAGE: 'image', COLOR: 'color' };
const commonIconClasses = ['h-12', 'w-12', 'rounded-full'];

const Icon = ({
  isLoading = false,
  isSelected = false,
  CustomMarker = null,
  name = '',
  onClick = noop,
  type,
  value = ''
}) => {
  let _Icon;
  if (type === ICON_TYPE.IMAGE) {
    _Icon = value ? (
      <img
        alt={`${name} icon`}
        className={clsm(commonIconClasses)}
        draggable={false}
        src={value}
      />
    ) : (
      <NoImageSrcIcon className={commonIconClasses} />
    );
  } else if (type === ICON_TYPE.COLOR) {
    _Icon = <div className={clsm([...commonIconClasses, value])} />;
  }

  let Marker = CustomMarker;
  if (isLoading) {
    Marker = <Spinner className="absolute" variant="light" />;
  } else if (isSelected) {
    Marker = (
      <motion.span
        {...createAnimationProps({
          animations: ['fadeIn-full'],
          options: { shouldAnimateOut: false }
        })}
        className="absolute"
      >
        <Checkmark
          className={clsm(['w-6', 'h-6', 'fill-black', 'dark:fill-white'])}
        />
      </motion.span>
    );
  }

  return (
    <button
      aria-label={`Select ${name} ${type} icon`}
      aria-pressed={isSelected}
      className={clsm([
        'relative',
        'flex',
        'items-center',
        'justify-center',
        'rounded-full',
        'select-none',
        'hover:ring-2',
        'outline-none',
        'hover:ring-black',
        'hover:dark:ring-white',
        'focus:ring-2',
        'focus:outline-none',
        'focus:ring-black',
        'focus:dark:ring-white',
        'duration-[0.15s]',
        'ease-in-out',
        'transition-all',
        isSelected && [
          'ring-2',
          'ring-black',
          'dark:ring-white',
          type === ICON_TYPE.IMAGE && [
            'before:absolute',
            'before:w-full',
            'before:h-full',
            'before:rounded-full',
            'before:ring-2',
            'before:ring-black',
            'before:dark:ring-white',
            'before:bg-lightOverlay',
            'dark:before:bg-modalOverlay'
          ]
        ]
      ])}
      data-testid={`${type}-${isSelected ? 'selected' : 'unselected'}-icon`}
      name={name}
      onClick={onClick}
      type="button"
    >
      {_Icon}
      {Marker}
    </button>
  );
};

Icon.propTypes = {
  CustomMarker: PropTypes.object,
  isLoading: PropTypes.bool,
  isSelected: PropTypes.bool,
  name: PropTypes.string,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(Object.values(ICON_TYPE)).isRequired,
  value: PropTypes.string
};

export default Icon;
