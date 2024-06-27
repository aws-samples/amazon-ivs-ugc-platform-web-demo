import buildServer from '../../buildServer';
import { getSecrets } from '../../shared/helpers';
import { getUser } from '../../channel/helpers';
import { injectAuthorizedRequest } from '../../testUtils';
import mockProductSearchResults from '../../__mocks__/productSearchResults.json';
import { searchProducts } from '../helpers';
import {
  MAX_SERVER_PARAM_LENGTH,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import { generateRandomString } from '../../__tests__/helpers';

jest.mock('../helpers', () => ({
  setupClient: jest.fn(),
  searchProducts: jest.fn(),
  createSearchProductsRequest: jest.fn()
}));

jest.mock('../../shared/helpers', () => ({
  ...jest.requireActual('../../shared/helpers'),
  getSecrets: jest.fn()
}));

jest.mock('../../channel/helpers', () => ({
  getUser: jest.fn()
}));

const keyword = 'Avengers';
const url = `/products/${keyword}`;
const defaultRequestParams = { method: 'GET' as const, url };

describe('getProducts controller', () => {
  const oldAmazonStreamActionFeatureFlag =
    process.env.ENABLE_AMAZON_PRODUCT_STREAM_ACTION;
  process.env.ENABLE_AMAZON_PRODUCT_STREAM_ACTION = 'true';

  afterAll(() => {
    process.env.ENABLE_AMAZON_PRODUCT_STREAM_ACTION =
      oldAmazonStreamActionFeatureFlag || 'false';
  });

  const server = buildServer();

  describe('error handling', () => {
    it(`should throw a 404 error if keyword length exceeds ${MAX_SERVER_PARAM_LENGTH}`, async () => {
      const invalidKeyword =
        generateRandomString(MAX_SERVER_PARAM_LENGTH) + 's';
      const response = await injectAuthorizedRequest(server, {
        method: 'GET',
        url: `/products/${invalidKeyword}`
      });

      expect(response.statusCode).toEqual(404);
    });

    it('should return an unexpected exception when an error is thrown', async () => {
      const searchProduct = searchProducts as jest.Mock;

      searchProduct.mockImplementation(() => {
        return Promise.reject(
          'Missing Credentials. Please specify accessKey and secretKey in client object.'
        );
      });

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const { __type } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(__type).toBe(UNEXPECTED_EXCEPTION);
    });
  });

  describe('general cases', () => {
    beforeAll(() => {
      const searchProduct = searchProducts as jest.Mock;
      const fetchSecrets = getSecrets as jest.Mock;
      const fetchUser = getUser as jest.Mock;

      fetchUser.mockImplementation(() => ({
        Item: {
          trackingId: {
            S: 'vzln75J4knxa-20'
          }
        }
      }));

      fetchSecrets.mockImplementation(() => ({
        accessKey: 'access-key',
        secretKey: 'secret-key',
        partnerTag: 'partner-tag'
      }));

      searchProduct.mockImplementation(() => {
        return mockProductSearchResults;
      });
    });

    it(`should not return a 404 error if keyword length does not exceed ${MAX_SERVER_PARAM_LENGTH}`, async () => {
      const validKeyword = generateRandomString(150);
      const response = await injectAuthorizedRequest(server, {
        method: 'GET',
        url: `/products/${validKeyword}`
      });

      expect(response.statusCode).toEqual(200);
    });

    it('should return product search results', async () => {
      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams
      });

      const result = JSON.parse(response.payload);

      expect(result).toEqual({
        items: [
          {
            images: {
              large: {
                url: 'https://m.media-amazon.com/images/I/41KsiGHKA-L._SL500_.jpg'
              },
              medium: {
                url: 'https://m.media-amazon.com/images/I/41KsiGHKA-L._SL160_.jpg'
              },
              small: {
                url: 'https://m.media-amazon.com/images/I/41KsiGHKA-L._SL75_.jpg'
              }
            },
            merchantInfo: 'Custom Apparel House',
            price: {
              displayAmount: '$2,740.00'
            },
            productURL:
              'https://www.amazon.com/dp/B0BF422V1P?tag=vzln75J4knxa-20&linkCode=osi&th=1&psc=1',
            title: 'Custom T-Shirts - Athletic Grey - 180pcs'
          }
        ],
        searchCount: 312,
        keyword: 'Avengers'
      });
    });
  });
});
