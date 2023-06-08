import { SearchResults } from './helpers';

interface ProductSummary {
  images: {
    large: {
      url: string | null;
    };
    medium: {
      url: string | null;
    };
    small: {
      url: string | null;
    };
  };
  title: string;
  price: {
    displayAmount: string | null;
  };
  productURL: string;
  merchantInfo: string | null;
}

export const getProductsSummary = (
  searchResults: SearchResults,
  trackingId: string
) => {
  const searchCount = searchResults?.SearchResult?.TotalResultCount || null;
  const results = searchResults?.SearchResult?.Items || [];

  const items = results.reduce((products: ProductSummary[], item) => {
    const urlLarge = item.Images.Primary.Large.URL || null;
    const urlMedium = item.Images.Primary.Medium.URL || null;
    const urlSmall = item.Images.Primary.Small.URL || null;
    const displayAmount = item.Offers?.Listings[0].Price?.DisplayAmount || null;
    const merchantInfo = item.Offers?.Listings[0]?.MerchantInfo?.Name || null;
    const productURL = trackingId
      ? item.DetailPageURL.replace(/tag=[^&]*/, `tag=${trackingId}`)
      : item.DetailPageURL;

    const product = {
      images: {
        large: {
          url: urlLarge
        },
        medium: {
          url: urlMedium
        },
        small: {
          url: urlSmall
        }
      },
      title: item.ItemInfo.Title.DisplayValue,
      price: {
        displayAmount
      },
      productURL,
      merchantInfo
    };

    products.push(product);

    return products;
  }, []);

  return {
    searchCount,
    items
  };
};
