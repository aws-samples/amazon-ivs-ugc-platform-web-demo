import { useRef } from 'react';
import PropTypes from 'prop-types';

import {
  getPrimaryBgColorClass,
  getSecondaryBgColorClasses,
  getSecondaryTextColorClass,
  shouldForceWhiteTextLightDark,
  shouldForceWhiteTextLightMode
} from './ProductTheme';
import { channel as $channelContent } from '../../../../content';
import { clsm } from '../../../../utils';
import { useModal, MODAL_TYPE } from '../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import FloatingNav from '../../../../components/FloatingNav';
import ProductCardImage from './ProductCardImage';
import ProductDescription from './ProductDescription';

const $content = $channelContent.actions.product;

const Product = ({ color, description, imageUrl, price, title }) => {
  const learnMoreButtonRef = useRef();
  const { openModal } = useModal();
  const { isMobileView } = useResponsiveDevice();

  const openProductDetails = () => {
    openModal({
      content: {
        productDescriptionContent: (
          <ProductDescription
            title={title}
            description={description}
            color={color}
            price={price}
            imageUrl={imageUrl}
          />
        )
      },
      type: MODAL_TYPE.PRODUCT_DESCRIPTION,
      lastFocusedElement: learnMoreButtonRef
    });
  };

  return (
    <div
      className={clsm([
        'break-anywhere',
        'flex-col',
        'flex',
        'items-center',
        'p-5',
        'rounded-3xl',
        'space-y-4',
        'w-full',
        isMobileView && 'mb-12'
      ])}
    >
      <ProductCardImage
        customClasses={['h-[216px]']}
        imageUrl={imageUrl}
        price={price}
        title={title}
        color={color}
      />
      <h2
        className={clsm([
          'dark:text-white',
          'font-bold',
          'leading-6',
          'text-black',
          'text-xl',
          'line-clamp-2'
        ])}
      >
        {title}
      </h2>
      <div className={clsm(['flex', 'flex-col', 'space-y-2', 'w-full'])}>
        <Button
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
            'sm:w-full'
          ])}
        >
          {$content.buy_now}
        </Button>
        <Button
          className={clsm([
            `dark:${getSecondaryTextColorClass(color)}`,
            getSecondaryBgColorClasses(color),
            'sm:w-full'
          ])}
          onClick={openProductDetails}
          ref={learnMoreButtonRef}
        >
          {$content.learn_more}
        </Button>
      </div>
      {isMobileView && <FloatingNav />}
    </div>
  );
};

Product.defaultProps = { color: 'default' };

Product.propTypes = {
  color: PropTypes.string,
  description: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

export default Product;
