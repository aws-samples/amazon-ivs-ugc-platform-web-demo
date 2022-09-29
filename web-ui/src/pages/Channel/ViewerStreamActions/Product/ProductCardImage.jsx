import PropTypes from 'prop-types';

import {
  getPrimaryBgColorClass,
  shouldForceWhiteTextLightDark,
  shouldForceWhiteTextLightMode
} from './ProductTheme';
import { clsm } from '../../../../utils';

const ProductCardImage = ({ imageUrl, title, price, color, customClasses }) => (
  <div
    className={clsm([
      'bg-lightMode-gray-light',
      'dark:bg-darkMode-gray',
      'relative',
      'rounded-3xl',
      'w-full',
      customClasses
    ])}
  >
    <img className={clsm(['rounded-3xl'])} src={imageUrl} alt={title} />
    <span
      className={clsm([
        'absolute',
        'px-2.5',
        'py-0.5',
        'right-3.5',
        'rounded-3xl',
        'top-3.5',
        'text-black',
        shouldForceWhiteTextLightMode(color) && [
          'text-white',
          'dark:text-black'
        ],
        shouldForceWhiteTextLightDark(color) && [
          'text-white',
          'dark:text-white'
        ],
        getPrimaryBgColorClass(color)
      ])}
    >
      {price}
    </span>
  </div>
);

ProductCardImage.defaultProps = {
  customClasses: [],
  color: 'default'
};

ProductCardImage.propTypes = {
  customClasses: PropTypes.arrayOf(PropTypes.string),
  imageUrl: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string
};

export default ProductCardImage;
