import { useRef } from 'react';
import PropTypes from 'prop-types';

import {
  productCardClasses,
  productHeaderClasses
} from '../../Product/ProductTheme';
import { useModal, MODAL_TYPE } from '../../../../../contexts/Modal';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import ProductButtons from './ProductButtons';
import ProductCardImage from './ProductCardImage';
import ProductDescription from './ProductDescription';

const Product = ({
  color,
  description,
  imageUrl,
  price,
  productUrl,
  title
}) => {
  const learnMoreButtonRef = useRef();

  const { isMobileView } = useResponsiveDevice();
  const { openModal } = useModal();

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
    <div className={productCardClasses(isMobileView)}>
      <ProductCardImage
        customClasses={['h-[220px]', 'min-w-[220px]']}
        imageUrl={imageUrl}
        price={price}
        title={title}
        color={color}
      />
      <h2 style={{ overflowWrap: 'anywhere' }} className={productHeaderClasses}>
        {title}
      </h2>
      <ProductButtons
        ref={learnMoreButtonRef}
        openProductDetails={openProductDetails}
        variant="popup"
        productUrl={productUrl}
      />
    </div>
  );
};

Product.defaultProps = { color: 'default', description: '', productUrl: '' };

Product.propTypes = {
  color: PropTypes.string,
  description: PropTypes.string,
  imageUrl: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  productUrl: PropTypes.string,
  title: PropTypes.string.isRequired
};

export default Product;
