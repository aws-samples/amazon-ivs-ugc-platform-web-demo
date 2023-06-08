import {
  createSearchProductsRequest,
  getMarketplaceInfo,
  LOCALE_MAP
} from '../helpers';

describe('createSearchProductsRequest', () => {
  it('should create a search product request object', () => {
    const queryStrings = {
      sort: 'Price:HighToLow',
      page: 2,
      language: 'es_US'
    };

    const queryParams = {
      keywords: 'Harry Potter'
    };

    const credentials = {
      accessKey: 'access-key',
      secretKey: 'secret-key',
      partnerTag: 'partner-tag'
    };

    const result = createSearchProductsRequest(
      queryParams.keywords,
      queryStrings,
      credentials
    );

    expect(result.PartnerTag).toBeTruthy();
    expect(result.PartnerType).toBeTruthy();
    expect(result.ItemCount).toEqual(10);
    expect(result.Keywords).toEqual('Harry Potter');
    expect(result.ItemPage).toEqual(2);
    expect(result.SortBy).toEqual('Price:HighToLow');
    expect(result.LanguagesOfPreference).toEqual(['es_US']);
    expect(result.Resources).toEqual([
      'Offers.Listings.Price',
      'Offers.Listings.MerchantInfo',
      'Images.Primary.Small',
      'Images.Primary.Medium',
      'Images.Primary.Large',
      'ItemInfo.Title'
    ]);
  });
});

describe('getMarketplaceInfo', () => {
  const mockConsoleError = jest.fn();
  const realConsoleError = console.error;

  beforeAll(() => {
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = realConsoleError;
  });

  const { host: US_HOST, region: US_REGION } = LOCALE_MAP['United States'];
  const { host: JAPAN_HOST, region: JAPAN_REGION } = LOCALE_MAP['Japan'];

  it('should provide the region and host to the United States marketplace (by default) if no locale is passed', () => {
    const { host, region } = getMarketplaceInfo();
    expect(host).toEqual(US_HOST);
    expect(region).toEqual(US_REGION);
  });

  it('should provide the region and host to the United States marketplace if locale was incorrectly spelt', () => {
    const { host, region } = getMarketplaceInfo('Kanada');
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(host).toEqual(US_HOST);
    expect(region).toEqual(US_REGION);
  });

  it('should provide the region and host to the United States marketplace if locale is not supported', () => {
    const { host, region } = getMarketplaceInfo('Bahamas');
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(host).toEqual(US_HOST);
    expect(region).toEqual(US_REGION);
  });

  it('should provide the correct region and host to a supported locale', () => {
    const { host, region } = getMarketplaceInfo('Japan');
    expect(host).toEqual(JAPAN_HOST);
    expect(region).toEqual(JAPAN_REGION);
  });
});
