import { useEffect, useState, useCallback } from 'react';

import {
  AMAZON_PRODUCT_DATA_KEYS,
  FETCH_AMAZON_PRODUCTS_ORIGINS,
  SORT_PRODUCTS_EXCEPTION,
  STREAM_ACTION_NAME,
  TOO_MANY_REQUESTS_EXCEPTION,
  BREAKPOINTS,
  SORT_CATEGORIES_TWO_COL,
  SORT_CATEGORIES_ONE_COL
} from '../../../../../../constants';
import { clsm } from '../../../../../../utils';
import { DEFAULT_STREAM_MANAGER_ACTIONS_STATE } from '../../../../../../contexts/StreamManagerActions/utils';
import { getAmazonProductData } from '../../../../../../api/amazonProduct';
import { SortButton } from './SortButton';
import { streamManager as $streamManagerContent } from '../../../../../../content';
import { useNotif } from '../../../../../../contexts/Notification';
import { useResponsiveDevice } from '../../../../../../contexts/ResponsiveDevice';
import { useStreamManagerActions } from '../../../../../../contexts/StreamManagerActions';
import ProductResults from './ProductResults/ProductResults';
import SearchGroup from './Search';
import SortDropdown from './SortDropdown';
import Tooltip from '../../../../../../components/Tooltip';
import useDebouncedCallback from '../../../../../../hooks/useDebouncedCallback';

const $content = $streamManagerContent.stream_manager_actions.amazon_product;

const DEFAULT_SELECTED_PRODUCT_INDEX =
  DEFAULT_STREAM_MANAGER_ACTIONS_STATE[STREAM_ACTION_NAME.AMAZON_PRODUCT][
    AMAZON_PRODUCT_DATA_KEYS.SELECTED_PRODUCT_INDEX
  ];

const DEFAULT_PAGE_NUMBER =
  DEFAULT_STREAM_MANAGER_ACTIONS_STATE[STREAM_ACTION_NAME.AMAZON_PRODUCT][
    AMAZON_PRODUCT_DATA_KEYS.PRODUCT_PAGE_NUMBER
  ];

const AmazonProduct = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [shouldResetContext, setShouldResetContext] = useState(false);

  const { notifyError } = useNotif();
  const { isMobileView, currentBreakpoint } = useResponsiveDevice();
  const {
    currentStreamManagerActionErrors,
    getStreamManagerActionData,
    handleResetAmazonProductData,
    isLoadingNextPageOfProducts,
    updateStreamManagerActionData,
    validateStreamManagerActionData,
    isValidKeyword,
    setIsValidKeyword,
    isLoading,
    setIsLoading
  } = useStreamManagerActions();

  const {
    keyword,
    productOptions,
    productPageNumber,
    selectedSortCategory,
    selectedProductIndex
  } = getStreamManagerActionData(STREAM_ACTION_NAME.AMAZON_PRODUCT);

  const sortCategories =
    currentBreakpoint <= BREAKPOINTS.sm
      ? SORT_CATEGORIES_ONE_COL
      : SORT_CATEGORIES_TWO_COL;

  const validateSearchKeyword = useCallback(
    (_keyword) => {
      const _isValidKeyword = validateStreamManagerActionData(
        { [AMAZON_PRODUCT_DATA_KEYS.KEYWORD]: _keyword },
        STREAM_ACTION_NAME.AMAZON_PRODUCT,
        { disableLengthValidation: false }
      );
      setIsValidKeyword(_isValidKeyword);
    },
    [validateStreamManagerActionData, setIsValidKeyword]
  );

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const handleSelectProduct = (e) => {
    const data = {
      [AMAZON_PRODUCT_DATA_KEYS.SELECTED_PRODUCT_INDEX]: +e.target.value,
      [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_CHOICE]: productOptions[+e.target.value]
    };
    // Update Amazon product choice context (selected product)
    updateStreamManagerActionData({
      dataOrFn: data,
      actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
    });
  };

  const resetPageNumberAndSelectedProductIndex = () => {
    const data = {
      [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_PAGE_NUMBER]: DEFAULT_PAGE_NUMBER,
      [AMAZON_PRODUCT_DATA_KEYS.SELECTED_PRODUCT_INDEX]:
        DEFAULT_SELECTED_PRODUCT_INDEX
    };
    updateStreamManagerActionData({
      dataOrFn: data,
      actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
    });
  };

  const processResponseForSearchResultsThatMatchesUserInput = (result) => {
    const _data = {
      [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_OPTIONS]: result.items
    };

    const _selectedProduct = {
      [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_CHOICE]:
        result.items.length > 0 ? result.items[0] : {}
    };

    [_data, _selectedProduct].forEach((data) => {
      updateStreamManagerActionData({
        dataOrFn: data,
        actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
      });
    });
  };

  const resetAmazonProductOptions = useCallback(() => {
    updateStreamManagerActionData({
      dataOrFn: {
        [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_OPTIONS]: []
      },
      actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
    });
  }, [updateStreamManagerActionData]);

  const processResponseForSearchResultsDoNotMatchUserInput = () => {
    if (isValidKeyword) return;

    resetAmazonProductOptions();
  };

  const fetchAmazonProductData = useDebouncedCallback(
    async (sortBy, origin, prevSortCategory) => {
      if (!isValidKeyword || keyword === '') return;

      setIsLoading(true);
      resetPageNumberAndSelectedProductIndex();
      const { error, result } = await getAmazonProductData(
        {
          sort: sortBy,
          ...(origin && { origin }),
          page: 1
        },
        keyword
      );
      if (error) {
        const content =
          error.__type === SORT_PRODUCTS_EXCEPTION ||
          error.__type === TOO_MANY_REQUESTS_EXCEPTION
            ? $streamManagerContent.notifications.error.an_error_occurred
            : $streamManagerContent.notifications.error.unable_to_get_products;

        if (origin === FETCH_AMAZON_PRODUCTS_ORIGINS.SORT) {
          const data = {
            [AMAZON_PRODUCT_DATA_KEYS.SELECTED_SORT_CATEGORY]: prevSortCategory
          };
          // Update Amazon product choice context (selected product)
          updateStreamManagerActionData({
            dataOrFn: data,
            actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
          });
        }
        setIsLoading(false);
        notifyError(content, {
          asPortal: true
        });
      } else {
        setIsLoading(false);
        if (keyword === result.keyword) {
          processResponseForSearchResultsThatMatchesUserInput(result);
        } else {
          processResponseForSearchResultsDoNotMatchUserInput(result);
        }
        setSearched(true);
      }
    },
    500
  );

  const handleSortCategoryClick = useCallback(
    async (e) => {
      const sortCategorySelected = sortCategories[+e.target.value].category;
      const prevSortCategorySelected = selectedSortCategory;

      validateSearchKeyword(keyword);
      setIsLoading(true);
      const data = {
        [AMAZON_PRODUCT_DATA_KEYS.SELECTED_SORT_CATEGORY]: sortCategorySelected,
        [AMAZON_PRODUCT_DATA_KEYS.SELECTED_PRODUCT_INDEX]:
          DEFAULT_SELECTED_PRODUCT_INDEX
      };

      // Update Amazon product choice context (selected product)
      updateStreamManagerActionData({
        dataOrFn: data,
        actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
      });

      isValidKeyword &&
        keyword !== '' &&
        (await fetchAmazonProductData(
          sortCategorySelected,
          FETCH_AMAZON_PRODUCTS_ORIGINS.SORT,
          prevSortCategorySelected
        ));
      setTimeout(toggleDropdown, 250);
      setIsLoading(false);
    },
    [
      sortCategories,
      isValidKeyword,
      fetchAmazonProductData,
      keyword,
      updateStreamManagerActionData,
      validateSearchKeyword,
      selectedSortCategory,
      setIsLoading
    ]
  );

  const updateAndFetchAmazonProductData = (data) => {
    validateSearchKeyword(data.keyword);
    setSearched(false);
    updateStreamManagerActionData({
      dataOrFn: data,
      actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
    });

    if (isLoading && data?.keyword === '') {
      setShouldResetContext(true);
    }
    if (data?.keyword === '') {
      handleResetAmazonProductData();
    } else {
      fetchAmazonProductData(selectedSortCategory);
    }
  };

  /**
   * Resets the Amazon product data on unmount
   */
  useEffect(() => {
    handleResetAmazonProductData();
    return () => handleResetAmazonProductData();
  }, [handleResetAmazonProductData]);

  /**
   * Ensures updated Amazon product search results is visible in desktop and mobile views.
   * Updates the default selected Amazon product to the first product in the list when a new search is completed.
   */
  useEffect(() => {
    if (!shouldResetContext) {
      const data = {
        [AMAZON_PRODUCT_DATA_KEYS.KEYWORD]: keyword,
        [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_OPTIONS]: productOptions,
        [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_PAGE_NUMBER]: productPageNumber,
        [AMAZON_PRODUCT_DATA_KEYS.SELECTED_PRODUCT_INDEX]: selectedProductIndex,
        [AMAZON_PRODUCT_DATA_KEYS.SELECTED_SORT_CATEGORY]: selectedSortCategory
      };

      updateStreamManagerActionData({
        dataOrFn: data,
        actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
      });
    }
  }, [
    selectedProductIndex,
    selectedSortCategory,
    isMobileView,
    keyword,
    productOptions,
    productPageNumber,
    shouldResetContext,
    updateStreamManagerActionData
  ]);

  useEffect(() => {
    if (!isLoading && shouldResetContext) {
      handleResetAmazonProductData();
      setShouldResetContext(false);
    }
  }, [handleResetAmazonProductData, isLoading, shouldResetContext]);

  useEffect(() => {
    if (!isLoading && !isValidKeyword) {
      resetAmazonProductOptions();
    }
  }, [isLoading, isValidKeyword, resetAmazonProductOptions]);

  return (
    <div className={clsm(['flex-1', 'flex-col', 'flex', 'space-y-8'])}>
      <div className={clsm(['flex', 'justify-between'])}>
        <SearchGroup
          errors={currentStreamManagerActionErrors}
          keyword={keyword}
          onChange={updateAndFetchAmazonProductData}
          placeholder={$content.search_placeholder}
        />
        <Tooltip
          hasFixedWidth
          message={$content.tooltip_message}
          translate={{ y: -2 }}
        >
          <SortButton
            isDropdownOpen={isDropdownOpen}
            onClick={toggleDropdown}
          />
        </Tooltip>
      </div>
      <SortDropdown
        sortCategories={sortCategories}
        isDropdownOpen={isDropdownOpen}
        onClick={handleSortCategoryClick}
        selectedSortCategory={selectedSortCategory}
      />
      <ProductResults
        data={productOptions || []}
        isLoading={isLoading}
        isLoadingNextPageOfProducts={isLoadingNextPageOfProducts}
        keyword={keyword}
        onClick={handleSelectProduct}
        searched={searched}
        selectedProductIndex={selectedProductIndex}
        isValidKeyword={isValidKeyword}
      />
    </div>
  );
};

export default AmazonProduct;
