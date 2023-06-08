const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk');

interface LocaleMap {
  [key: string]: {
    host: string;
    region: string;
  };
}

// Supported locales: https://webservices.amazon.com/paapi5/documentation/locale-reference.html#locale-reference-for-product-advertising-api
export const LOCALE_MAP: LocaleMap = {
  Australia: {
    host: 'webservices.amazon.com.au',
    region: 'us-west-2'
  },
  Belgium: {
    host: 'webservices.amazon.com.be',
    region: 'eu-west-1'
  },
  Brazil: {
    host: 'webservices.amazon.com.br',
    region: 'us-east-1'
  },
  Canada: {
    host: 'webservices.amazon.ca',
    region: 'us-east-1'
  },
  Egypt: {
    host: 'webservices.amazon.eg',
    region: 'eu-west-1'
  },
  France: {
    host: 'webservices.amazon.fr',
    region: 'eu-west-1'
  },
  Germany: {
    host: 'webservices.amazon.de',
    region: 'eu-west-1'
  },
  India: {
    host: 'webservices.amazon.in',
    region: 'eu-west-1'
  },
  Italy: {
    host: 'webservices.amazon.it',
    region: 'eu-west-1'
  },
  Japan: {
    host: 'webservices.amazon.co.jp',
    region: 'us-west-2'
  },
  Mexico: {
    host: 'webservices.amazon.com.mx',
    region: 'us-east-1'
  },
  Netherlands: {
    host: 'webservices.amazon.nl',
    region: 'eu-west-1'
  },
  Poland: {
    host: 'webservices.amazon.pl',
    region: 'eu-west-1'
  },
  Singapore: {
    host: 'webservices.amazon.sg',
    region: 'us-west-2'
  },
  'Saudi Arabia': {
    host: 'webservices.amazon.sa',
    region: 'eu-west-1'
  },
  Spain: {
    host: 'webservices.amazon.es',
    region: 'eu-west-1'
  },
  Sweden: {
    host: 'webservices.amazon.se',
    region: 'eu-west-1'
  },
  Turkey: {
    host: 'webservices.amazon.com.tr',
    region: 'eu-west-1'
  },
  'United Arab Emirates': {
    host: 'webservices.amazon.ae',
    region: 'eu-west-1'
  },
  'United Kingdom': {
    host: 'webservices.amazon.co.uk',
    region: 'eu-west-1'
  },
  'United States': {
    host: 'webservices.amazon.com',
    region: 'us-east-1'
  }
};

export const DEFAULT_LOCALE = 'United States';

export const getMarketplaceInfo = (locale = DEFAULT_LOCALE) => {
  const { host, region } = LOCALE_MAP[locale] || {};

  // Note: it is possible for an affiliate account to not be registered to the default marketplace (United States)
  if (!host && !region) {
    console.error(
      `The current locale: ${locale} is incorrectly spelt or is not supported. Attempting to access the United States (default) marketplace.`
    );
    return {
      host: LOCALE_MAP[DEFAULT_LOCALE].host,
      region: LOCALE_MAP[DEFAULT_LOCALE].region
    };
  }

  return {
    host,
    region
  };
};

export const createSearchProductsRequest = (
  keywords: string,
  queryStrings: { sort?: string; page?: number; language?: string },
  secrets: { accessKey?: string; secretKey?: string; partnerTag?: string }
) => {
  const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
  defaultClient.accessKey = secrets.accessKey;
  defaultClient.secretKey = secrets.secretKey;

  const { host, region } = getMarketplaceInfo(process.env.PRODUCT_API_LOCALE);
  defaultClient.host = host;
  defaultClient.region = region;

  const searchProductsRequest =
    new ProductAdvertisingAPIv1.SearchItemsRequest();

  searchProductsRequest['Keywords'] = keywords;
  searchProductsRequest['ItemCount'] = 10;
  searchProductsRequest['PartnerTag'] = secrets.partnerTag;
  searchProductsRequest['PartnerType'] = 'Associates';
  searchProductsRequest['Availability'] = 'Available';
  searchProductsRequest['Resources'] = [
    'Offers.Listings.Price',
    'Offers.Listings.MerchantInfo',
    'Images.Primary.Small',
    'Images.Primary.Medium',
    'Images.Primary.Large',
    'ItemInfo.Title'
  ];

  const { sort, page, language } = queryStrings;
  if (sort) searchProductsRequest['SortBy'] = sort;
  if (page) searchProductsRequest['ItemPage'] = Number(page);
  if (language) searchProductsRequest['LanguagesOfPreference'] = [language];

  return searchProductsRequest;
};

type SearchRequest = {
  Keywords: string;
  ItemCount: number;
  PartnerTag: string;
  PartnerType: string;
  Resources: string[];
  Availability: string;
  SortBy?: string;
  ItemPage?: number;
};

type OfferListing = {
  Price: {
    DisplayAmount: string;
  };
  MerchantInfo: {
    Name: string;
  };
};

type Product = {
  DetailPageURL: string;
  ItemInfo: {
    Title: {
      DisplayValue: string;
    };
  };
  Images: {
    Primary: {
      Large: {
        URL: string;
      };
      Medium: {
        URL: string;
      };
      Small: {
        URL: string;
      };
    };
  };
  Offers: {
    Listings: OfferListing[];
  };
};

export interface SearchResults {
  SearchResult: {
    TotalResultCount: number;
    Items: Product[];
  };
}

// Error when trying to await api.searchItems, create a promise
// https://stackoverflow.com/questions/63317137/amazon-product-advertising-api-error-double-callback-bug-when-using-await
export const searchProducts = (searchProductsRequest: SearchRequest) => {
  const api = new ProductAdvertisingAPIv1.DefaultApi();

  return new Promise<SearchResults>((resolve, reject) => {
    api.searchItems(searchProductsRequest, (err: any, data: any) => {
      if (err) {
        const paapiError = err?.response?.text || '';
        console.error(`Error: ${err?.message} ${paapiError}`);
        reject(err);
      }
      resolve(data);
    });
  });
};
