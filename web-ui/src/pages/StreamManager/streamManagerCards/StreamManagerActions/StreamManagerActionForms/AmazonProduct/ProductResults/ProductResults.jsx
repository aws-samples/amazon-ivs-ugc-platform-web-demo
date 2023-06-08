import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';

import { clsm, noop } from '../../../../../../../utils';
import { createAnimationProps } from '../../../../../../../helpers/animationPropsHelper';
import { streamManager as $streamManagerContent } from '../../../../../../../content';
import Label from '../../../../../../../components/Input/InputLabel';
import ProductItems from './ProductItems';
import ProductResultsEmptyContainer from '../ProductResults/ProductResultsEmptyContainer';
import ProductResultsLoader from './ProductResultsLoader';

const $content = $streamManagerContent.stream_manager_actions.amazon_product;

const commonContainerProps = [
  'flex-1',
  'flex-col',
  'flex',
  'items-center',
  'justify-center',
  'w-full'
];

const ProductResults = ({
  data,
  isLoading,
  isLoadingNextPageOfProducts,
  keyword,
  searched,
  onClick,
  selectedProductIndex,
  isValidKeyword
}) => {
  let resultsContent;
  const isEmpty = !data.length;

  if (isLoading) {
    resultsContent = (
      <ProductResultsLoader className={clsm(commonContainerProps)} />
    );
  } else if (!isLoading && isEmpty) {
    resultsContent = (
      <ProductResultsEmptyContainer
        className={clsm(commonContainerProps)}
        noResultsText={$content.no_results.no_results_for_search}
        keyword={keyword}
        emptyText={$content.empty_text}
        searched={searched}
        isValidKeyword={isValidKeyword}
      />
    );
  } else {
    resultsContent = (
      <ProductItems
        data={data}
        isLoadingNextPageOfProducts={isLoadingNextPageOfProducts}
        onClick={onClick}
        notAvailableText={$content.no_results}
        selectedProductIndex={selectedProductIndex}
      />
    );
  }

  return (
    <motion.div className="flex-1">
      <div className={clsm(['flex', 'flex-col', 'h-full'])}>
        <AnimatePresence mode="wait">
          <motion.div
            {...createAnimationProps({
              animations: ['fadeIn-full'],
              transition: { duration: 0.25 },
              options: {
                isVisible: !isEmpty && !isLoading
              }
            })}
            className={clsm([
              'flex',
              'justify-between',
              'mb-8',
              isEmpty || isLoading
                ? ['w-0', 'h-0', 'absolute']
                : ['w-auto', 'h-auto']
            ])}
            key="amazon-product-results-container"
          >
            <Label label={$content.title} />
          </motion.div>
          {resultsContent}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

ProductResults.propTypes = {
  data: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isLoadingNextPageOfProducts: PropTypes.bool.isRequired,
  isValidKeyword: PropTypes.bool.isRequired,
  keyword: PropTypes.string,
  onClick: PropTypes.func,
  searched: PropTypes.bool,
  selectedProductIndex: PropTypes.number.isRequired
};

ProductResults.defaultProps = {
  keyword: '',
  searched: false,
  onClick: noop
};

export default ProductResults;
