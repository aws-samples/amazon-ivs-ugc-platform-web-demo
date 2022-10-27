import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

import {
  getPrimaryButtonBgColorClass,
  getSecondaryBgColorClasses,
  getSecondaryTextColorClass,
  shouldForceWhiteTextLightDark,
  shouldForceWhiteTextLightMode
} from './ProductTheme';
import {
  BUTTON_CONTAINER_BASE_CLASSES as buttonContainerBaseClasses,
  BUTTON_CONTAINER_VARIANT_CLASSES as buttonContainerVariantClasses,
  BUTTON_VARIANT_CLASSES as buttonVariantClasses
} from './ProductButtonTheme';
import { channel as $channelContent } from '../../../../content';
import { clsm, noop } from '../../../../utils';
import { useChannel } from '../../../../contexts/Channel';
import Button from '../../../../components/Button';

const $productPopupContent = $channelContent.actions.product;

const ProductButtons = forwardRef(({ openProductDetails, variant }, ref) => {
  const { channelData } = useChannel();
  const { color = 'default' } = channelData;
  const isModal = !(variant === 'popup');
  const productContainerClasses = [
    buttonContainerBaseClasses,
    buttonContainerVariantClasses[variant]
  ];

  return (
    <div className={clsm(productContainerClasses)}>
      <Button
        ariaLabel={`${$productPopupContent.buy_now}`}
        onClick={noop}
        className={clsm([
          getPrimaryButtonBgColorClass(color),
          shouldForceWhiteTextLightMode(color) && [
            'text-white',
            'dark:text-black'
          ],
          shouldForceWhiteTextLightDark(color) && [
            'text-white',
            'dark:text-white'
          ],
          'md:w-full',
          isModal && 'w-full'
        ])}
      >
        {isModal
          ? $productPopupContent.popup.buy_now
          : $productPopupContent.buy_now}
      </Button>
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
    </div>
  );
});

ProductButtons.defaultProps = {
  openProductDetails: noop
};

ProductButtons.propTypes = {
  openProductDetails: PropTypes.func,
  variant: PropTypes.oneOf([
    'popup',
    'productDescriptionDesktop',
    'productDescriptionMobile'
  ]).isRequired
};

export default ProductButtons;
