import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import {
  getPrimaryButtonBgColorClass,
  getSecondaryBgColorClasses,
  getSecondaryTextColorClass,
  shouldForceWhiteTextLightDark,
  shouldForceWhiteTextLightMode,
  amazonButtonClasses
} from '../ProductTheme';
import {
  BUTTON_CONTAINER_BASE_CLASSES as buttonContainerBaseClasses,
  BUTTON_CONTAINER_VARIANT_CLASSES as buttonContainerVariantClasses,
  BUTTON_VARIANT_CLASSES as buttonVariantClasses
} from './ProductButtonTheme';
import { AmazonA } from '../../../../../assets/icons';
import { channel as $channelContent } from '../../../../../content';
import { clsm, noop } from '../../../../../utils';
import { useChannel } from '../../../../../contexts/Channel';
import Button from '../../../../../components/Button';

const $productPopupContent = $channelContent.actions.product;

const ProductButtons = forwardRef(
  ({ openProductDetails, variant, productUrl }, ref) => {
    const { channelData } = useChannel();

    const { color = 'default' } = channelData;
    const isModal = variant !== 'popup';
    const isAmazonProduct = productUrl !== '';

    const productContainerClasses = [
      buttonContainerBaseClasses,
      buttonContainerVariantClasses[variant]
    ];

    const buttonClasses = isAmazonProduct
      ? amazonButtonClasses
      : getPrimaryButtonBgColorClass(color);

    const buttonTextClasses = isAmazonProduct
      ? 'text-black'
      : [
          shouldForceWhiteTextLightMode(color) && [
            'text-white',
            'dark:text-black'
          ],
          shouldForceWhiteTextLightDark(color) && [
            'text-white',
            'dark:text-white'
          ]
        ];

    return (
      <div className={clsm(productContainerClasses)}>
        <Button
          ariaLabel={`${$productPopupContent.buy_now}`}
          onClick={
            isAmazonProduct ? () => window.open(productUrl, '_blank') : noop
          }
          className={clsm([
            buttonClasses,
            buttonTextClasses,
            isModal && 'w-full',
            '[&>svg]:fill-black',
            'dark:[&>svg]:fill-black',
            '[&>svg]:h-[24px]',
            '[&>svg]:w-[24px]',
            '[&>svg]:mr-2',
            'md:w-full'
          ])}
        >
          {isAmazonProduct && <AmazonA />}
          {isModal
            ? $productPopupContent.popup.buy_now
            : $productPopupContent.buy_now}
        </Button>
        {!isAmazonProduct && (
          <Button
            className={clsm([
              `dark:${getSecondaryTextColorClass(color)}`,
              getSecondaryBgColorClasses(color),
              'md:w-full',
              buttonVariantClasses[variant]
            ])}
            onClick={isModal ? noop : openProductDetails}
            ref={ref}
          >
            {isModal
              ? $productPopupContent.popup.add_to_cart
              : $productPopupContent.learn_more}
          </Button>
        )}
      </div>
    );
  }
);

ProductButtons.defaultProps = {
  openProductDetails: noop,
  productUrl: ''
};

ProductButtons.propTypes = {
  openProductDetails: PropTypes.func,
  productUrl: PropTypes.string,
  variant: PropTypes.oneOf([
    'popup',
    'productDescriptionDesktop',
    'productDescriptionMobile'
  ]).isRequired
};

export default ProductButtons;
