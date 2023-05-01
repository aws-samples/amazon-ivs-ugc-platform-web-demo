import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { AMAZON_PRODUCT_DATA_KEYS } from '../../../../../../../constants';
import { clsm } from '../../../../../../../utils';
import { createAnimationProps } from '../../../../../../../helpers/animationPropsHelper';
import ProductResultsRow from './ProductResultsRow';
import Spinner from '../../../../../../../components/Spinner';
import { defaultSlideUpVariant } from '../../../../../../Channel/ViewerStreamActions/viewerStreamActionsTheme';

import { streamManager as $streamManagerContent } from '../../../../../../../content';

const $content = $streamManagerContent.stream_manager_actions.amazon_product;

const ProductItems = ({
  data,
  onClick,
  notAvailableText,
  selectedProductIndex,
  isLoadingNextPageOfProducts
}) => (
  <motion.div
    key="results"
    {...createAnimationProps({
      animations: ['fadeIn-full'],
      transition: { duration: 0.25 }
    })}
    className={clsm([
      'lg:w-full',
      'sm:px-4',
      'space-y-8',
      'xs:pl-3',
      'xs:pr-0'
    ])}
  >
    {data.map((productData, index) => {
      const title = productData?.title;
      const shouldIndicateLoadingMoreProducts = index === data.length - 1;

      const isAtBottomOfProductList =
        index === data.length - 1 && !isLoadingNextPageOfProducts;

      const ariaLabel = isAtBottomOfProductList
        ? $content.aria_label_last_product + title
        : shouldIndicateLoadingMoreProducts
        ? $content.aria_label_load_more_products + title
        : title;

      return (
        <ProductResultsRow
          dataKey={AMAZON_PRODUCT_DATA_KEYS.PRODUCT_OPTIONS}
          imgSrc={productData?.images?.medium?.url}
          index={index}
          key={`amazon-product-${index}`}
          merchantInfo={
            productData?.merchantInfo ||
            notAvailableText.seller_name_not_available
          }
          onClick={onClick}
          price={
            productData?.price.displayAmount ||
            notAvailableText.price_not_available
          }
          selectedProductIndex={selectedProductIndex}
          title={title}
          ariaLabel={ariaLabel}
        />
      );
    })}
    <AnimatePresence>
      {isLoadingNextPageOfProducts && (
        <motion.div
          key={'results-loader'}
          {...createAnimationProps({
            animations: ['slideIn-bottom'],
            transition: { duration: 0.25 },
            customVariants: defaultSlideUpVariant
          })}
          className={clsm(['flex', 'justify-center', 'min-h-[80px]'])}
        >
          <Spinner size="large" variant="light" />
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

ProductItems.propTypes = {
  data: PropTypes.array.isRequired,
  notAvailableText: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  selectedProductIndex: PropTypes.number.isRequired,
  isLoadingNextPageOfProducts: PropTypes.bool.isRequired
};

ProductItems.defaultProps = {
  notAvailableText: ''
};

export default ProductItems;
