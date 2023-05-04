import { useCallback, useEffect } from 'react';

import {
  AMAZON_PRODUCT_DATA_KEYS,
  INFINITE_SCROLL_OFFSET,
  MAX_ITEMS_BEFORE_CONTENT_OVERFLOW,
  MAX_PAGES_TO_SCROLL,
  STREAM_ACTION_NAME
} from '../../../../../../constants';
import { getAmazonProductData } from '../../../../../../api/amazonProduct';
import { streamManager as $streamManagerContent } from '../../../../../../../src/content';
import { useNotif } from '../../../../../../contexts/Notification';
import { useResponsiveDevice } from '../../../../../../contexts/ResponsiveDevice';
import { useStreamManagerActions } from '../../../../../../contexts/StreamManagerActions';
import useThrottledCallback from '../../../../../../hooks/useThrottledCallback';

const useScrollListener = (
  actionName,
  mainContentRef,
  setIsContentOverflowing
) => {
  const {
    isLoadingNextPageOfProducts,
    setIsLoadingNextPageOfProducts,
    getStreamManagerActionData,
    updateStreamManagerActionData,
    isLoading
  } = useStreamManagerActions();
  const { notifyError } = useNotif();

  const { keyword, productOptions, selectedSortCategory, productPageNumber } =
    getStreamManagerActionData(STREAM_ACTION_NAME.AMAZON_PRODUCT);

  const { isMobileView } = useResponsiveDevice();

  const onScrolledToBottom = useThrottledCallback(
    async ({
      keyword,
      productOptions,
      sortBy,
      pageNumber,
      isLoadingNextPageOfProducts
    }) => {
      if (!isLoadingNextPageOfProducts && keyword !== '' && pageNumber <= 5) {
        setIsLoadingNextPageOfProducts(true);
        const { error, result } = await getAmazonProductData(
          {
            sort: sortBy,
            page: pageNumber
          },
          keyword
        );
        if (error) {
          setIsLoadingNextPageOfProducts(false);
          notifyError(
            $streamManagerContent.notifications.error.unable_to_get_products,
            {
              asPortal: true
            }
          );
        } else {
          const newProductList = [...productOptions, ...result.items];
          const newContextData = {
            [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_OPTIONS]: newProductList,
            [AMAZON_PRODUCT_DATA_KEYS.SELECTED_SORT_CATEGORY]: sortBy,
            [AMAZON_PRODUCT_DATA_KEYS.PRODUCT_PAGE_NUMBER]: pageNumber
          };
          updateStreamManagerActionData({
            dataOrFn: newContextData,
            actionName: STREAM_ACTION_NAME.AMAZON_PRODUCT
          });
          setIsLoadingNextPageOfProducts(false);
        }
      }
    },
    500
  );

  const handleScroll = useCallback(
    (mainContent) => {
      const hasScrolledToBottom =
        mainContent.scrollTop +
          INFINITE_SCROLL_OFFSET +
          mainContent.clientHeight >=
        mainContent.scrollHeight;
      const shouldFetchMoreProducts = productPageNumber < MAX_PAGES_TO_SCROLL;
      if (hasScrolledToBottom && shouldFetchMoreProducts) {
        onScrolledToBottom({
          keyword,
          productOptions,
          sortBy: selectedSortCategory,
          pageNumber: productPageNumber + 1,
          isLoadingNextPageOfProducts
        });
      }
    },
    [
      selectedSortCategory,
      onScrolledToBottom,
      isLoadingNextPageOfProducts,
      keyword,
      productOptions,
      productPageNumber
    ]
  );

  useEffect(() => {
    // Add a divider if product options is more than 5 items which is the maximum number of items before scrolling
    if (actionName === STREAM_ACTION_NAME.AMAZON_PRODUCT) {
      if (productOptions.length > MAX_ITEMS_BEFORE_CONTENT_OVERFLOW)
        setIsContentOverflowing(true);
      if (productOptions.length === 0 || isLoading)
        setIsContentOverflowing(false);
    }
  }, [actionName, isLoading, productOptions.length, setIsContentOverflowing]);

  useEffect(() => {
    // Add a scroll event listener only if the action is an amazon product
    if (actionName === STREAM_ACTION_NAME.AMAZON_PRODUCT) {
      const mainRefCurrent = mainContentRef?.current;
      const _handleScroll = () => handleScroll(mainRefCurrent);
      mainContentRef.current?.addEventListener('scroll', _handleScroll);
      return () => {
        mainRefCurrent?.removeEventListener('scroll', _handleScroll);
      };
    }
  }, [actionName, handleScroll, mainContentRef, isMobileView]);

  return null;
};

export default useScrollListener;
