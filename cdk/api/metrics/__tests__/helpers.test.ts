import { getPeriodValue } from '../helpers';

const mockNow = new Date('2022-06-10T19:12:05.000Z');
const mockNowTimestamp = mockNow.getTime();

describe('metrics helpers', () => {
  describe('getPeriodValue', () => {
    const realDateNow = Date.now.bind(global.Date);

    beforeAll(() => {
      Date.now = jest.fn(() => mockNowTimestamp);
    });

    afterAll(() => {
      Date.now = realDateNow;
    });

    it('should return a period of 3600', () => {
      // 64 days and 2 minutes ago
      const period = getPeriodValue(new Date('2022-04-07T19:10:00.000Z'));

      expect(period).toBe(3600);
    });

    it('should return a period of 300', () => {
      // 26 days ago
      const period = getPeriodValue(new Date('2022-05-15T19:12:00.000Z'));

      expect(period).toBe(300);
    });

    it('should return a period of 60', () => {
      // 9 days ago
      const period = getPeriodValue(new Date('2022-06-01T19:12:00.000Z'));

      expect(period).toBe(60);
    });

    it('should return a period of 5', () => {
      // 5 minutes ago
      const period = getPeriodValue(new Date('2022-06-10T19:07:05.000Z'));

      expect(period).toBe(5);
    });
  });
});
