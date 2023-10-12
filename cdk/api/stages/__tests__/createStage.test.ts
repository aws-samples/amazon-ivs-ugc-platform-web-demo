import buildServer from '../../buildServer';
import { injectAuthorizedRequest } from '../../testUtils';
import userInfo from '../../__mocks__/userInfo.json';
import { handleCreateStage, handleCreateStageParams } from '../helpers';
import { UNEXPECTED_EXCEPTION } from '../../shared/constants';
import createStageParamsMock from '../__mocks__/createStageParamsMock.json';

const { UserItem } = userInfo;
const token = 'expectedToken';
const stageId = 'expectedStageId';

jest.mock('../../shared/helpers', () => ({
  ...jest.requireActual('../../shared/helpers'),
  getSecrets: jest.fn(),
  updateDynamoItemAttributes: jest.fn()
}));

jest.mock('../helpers');

const url = '/stages/create';
const defaultRequestParams = { method: 'GET' as const, url };
const server = buildServer();

describe('createStage controller', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('error handling', () => {
    beforeAll(() => {
      const createStage = handleCreateStage as jest.Mock;
      createStage.mockRejectedValue(
        'call to ivsrealtime.createStage failed to create a new stage'
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

    it('should throw an error if createStage function fails', async () => {
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe(UNEXPECTED_EXCEPTION);
    });
  });

  describe('general cases', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });
    beforeAll(() => {
      const createStageParams = handleCreateStageParams as jest.Mock;
      const createStage = handleCreateStage as jest.Mock;

      createStageParams.mockImplementation(() => ({
        ...UserItem,
        ...createStageParamsMock
      }));

      createStage.mockImplementation(() => ({
        token,
        stageId
      }));
    });

    it(`should return stages arn and token`, async () => {
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const res = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(200);
      expect(res).toEqual({
        token,
        stageId
      });
    });
  });
});
