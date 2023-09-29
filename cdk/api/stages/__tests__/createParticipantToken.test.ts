import buildServer from '../../buildServer';
import { injectAuthorizedRequest } from '../../testUtils';
import userInfo from '../../__mocks__/userInfo.json';
import { getUser } from '../../channel/helpers';
import {
  handleCreateParticipantToken,
  handleCreateStageParams
} from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import createStageParamsMock from '../__mocks__/createStageParamsMock.json';

const { UserItem } = userInfo;
const token = 'expectedToken';

jest.mock('../../shared/helpers', () => ({
  ...jest.requireActual('../../shared/helpers'),
  getSecrets: jest.fn()
}));

jest.mock('../../channel/helpers', () => ({
  getUser: jest.fn()
}));

jest.mock('../helpers');

const mockStageId = 'LibZCqmty5Tm';
const url = `/stages/createParticipantToken/${mockStageId}`;
const defaultRequestParams = { method: 'GET' as const, url };
const server = buildServer();

describe('createParticipantToken controller', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('error handling', () => {
    beforeAll(() => {
      const fetchUser = getUser as jest.Mock;
      const createParticipantToken = handleCreateParticipantToken as jest.Mock;

      fetchUser.mockImplementation(() => UserItem);

      createParticipantToken.mockRejectedValue(
        'call to ivsrealtime.createParticipantToken failed to create a new participant token'
      );
    });

    it('should throw an error if unauthenticated', async () => {
      const response = await server.inject({
        ...defaultRequestParams,
        headers: { authorization: 'invalidToken' }
      });

      const { message } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(message).toBe('UnauthorizedException');
    });

    it('should throw an error if createParticipantToken function fails', async () => {
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe(UNEXPECTED_EXCEPTION);
    });
  });

  describe('general case', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });
    beforeAll(() => {
      const createParticipantToken = handleCreateParticipantToken as jest.Mock;
      const createStageParams = handleCreateStageParams as jest.Mock;

      createStageParams.mockImplementation(() => ({
        ...UserItem,
        ...createStageParamsMock
      }));
      createParticipantToken.mockImplementation(() => token);
    });

    it(`should return a participant token`, async () => {
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const res = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(200);
      expect(res).toEqual({
        token
      });
    });
  });
});
