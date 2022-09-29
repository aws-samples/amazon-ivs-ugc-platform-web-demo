import { clsm, noop } from '../../../../utils';
import PropTypes from 'prop-types';

import {
  getPrimaryBgColorClass,
  getSecondaryBgColorClasses,
  getSecondaryTextColorClass,
  shouldForceWhiteTextLightDark,
  shouldForceWhiteTextLightMode
} from './ProductTheme';
import { BREAKPOINTS } from '../../../../constants';
import { channel as $channelContent } from '../../../../content';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import ProductCardImage from './ProductCardImage';

const $popupContent = $channelContent.actions.product.popup;

const ProductDescription = ({ title, description, color, price, imageUrl }) => {
  const { currentBreakpoint } = useResponsiveDevice();
  const isSmallBreakpoint = currentBreakpoint < BREAKPOINTS.sm;

  const customClasses = ['max-w-[318px]', 'sm:max-w-none', 'max-h-[318px]'];
  const productImgEl = (
    <ProductCardImage
      color={color}
      customClasses={customClasses}
      imageUrl={imageUrl}
      price={price}
      title={title}
    />
  );

  return (
    <div className={clsm(['flex', 'sm:flex-col', 'w-full', 'justify-between'])}>
      {!isSmallBreakpoint && productImgEl}
      <div
        className={clsm([
          'flex',
          'flex-col',
          'justify-end',
          'max-w-[180px]',
          'sm:max-w-none'
        ])}
      >
        <div
          className={clsm([
            'h-full',
            'flex',
            'flex-col',
            'justify-center',
            'sm:pb-8'
          ])}
        >
          <h3>{title}</h3>
          <p
            className={clsm([
              'pt-2.5',
              'sm:pt-2',
              'text-[#A0A0A0]',
              'text-sm',
              'sm:text-md'
            ])}
          >
            {description}
          </p>
        </div>
        {isSmallBreakpoint && productImgEl}
        <div className={clsm(['items-center', 'flex', 'flex-col', 'sm:pt-8'])}>
          <Button
            ariaLabel={`${$popupContent.buy_now}`}
            className={clsm([
              `hover:${getPrimaryBgColorClass(color)}-hover`,
              `focus:${getPrimaryBgColorClass(color)}`,
              getPrimaryBgColorClass(color),
              shouldForceWhiteTextLightMode(color) && [
                'text-white',
                'dark:text-black'
              ],
              shouldForceWhiteTextLightDark(color) && [
                'text-white',
                'dark:text-white'
              ],
              'w-full'
            ])}
            onClick={noop}
          >
            {$popupContent.buy_now}
          </Button>
          <Button
            ariaLabel={`${$popupContent.add_to_cart}`}
            className={clsm([
              'mt-2.5',
              'sm:mt-3',
              'w-full',
              `dark:${getSecondaryTextColorClass(color)}`,
              getSecondaryBgColorClasses(color)
            ])}
            onClick={noop}
          >
            {$popupContent.add_to_cart}
          </Button>
        </div>
      </div>
    </div>
  );
};

ProductDescription.defaultProps = {
  color: 'default',
  price: '',
  imageUrl: ''
};

ProductDescription.propTypes = {
  description: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  price: PropTypes.string,
  color: PropTypes.string,
  imageUrl: PropTypes.string
};

export default ProductDescription;
