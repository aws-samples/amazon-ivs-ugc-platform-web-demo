import { apiBaseUrl, authFetch } from './utils';

export const getAmazonProductData = async (queryData = {}, keyword) => {
  const encodedKeyword = encodeURIComponent(keyword);
  const qs = new URLSearchParams(queryData).toString();
  const queryString = qs ? `?${qs}` : '';
  return await authFetch({
    url: `${apiBaseUrl}/products/${encodedKeyword}${queryString}`
  });
};
