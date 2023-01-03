import PropTypes from 'prop-types';

import { clsm } from '../../../../../../utils';

const ThumbSlider = ({ className, ownerState, style, ...restProps }) => (
  <div
    className={clsm([
      '-ml-2.5',
      '!pointer-events-all',
      'absolute',
      'cursor-pointer',
      'flex',
      'h-5',
      'items-center',
      'justify-center',
      'w-5'
    ])}
    style={style}
  >
    <span
      className={clsm([
        className,
        className.includes('Mui-active') && [
          'dark:shadow-darkMode-sliderThumb-active',
          'shadow-[0_0_0_8px]',
          'shadow-lightMode-sliderThumb-active'
        ]
      ])}
      {...restProps}
    />
  </div>
);

ThumbSlider.propTypes = {
  className: PropTypes.string.isRequired,
  ownerState: PropTypes.object.isRequired,
  style: PropTypes.object.isRequired
};

export default ThumbSlider;
