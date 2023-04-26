import { getProductsSummary } from '../mappers';
import mockProductSearchResults from '../../__mocks__/productSearchResults.json';

describe('getProductsSummary', () => {
  it('should provide a summary of the search count and all the products when results are provided', () => {
    const trackingId = 'vZLn75J4KNXA-20';
    const result = getProductsSummary(mockProductSearchResults, trackingId);
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
            'https://www.amazon.com/dp/B0BF422V1P?tag=vZLn75J4KNXA-20&linkCode=osi&th=1&psc=1',
          title: 'Custom T-Shirts - Athletic Grey - 180pcs'
        }
      ],
      searchCount: 312
    });
  });

  it('should return a null searchCount value and empty items array in the event that data is corrupt', () => {
    // @ts-ignore
    const result = getProductsSummary(undefined, null);
    expect(result).toEqual({ items: [], searchCount: null });
  });
});
