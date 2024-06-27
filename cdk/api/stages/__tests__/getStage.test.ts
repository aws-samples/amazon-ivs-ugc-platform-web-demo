import { GetStageCommandOutput } from '@aws-sdk/client-ivs-realtime';
import { getStage } from '../helpers';
import { injectAuthorizedRequest } from '../../testUtils';
import {
  RESOURCE_NOT_FOUND_EXCEPTION,
  UNEXPECTED_EXCEPTION
} from '../../shared/constants';
import * as stageHelpers from '../helpers';
import buildServer from '../../buildServer';

const mockStageData = {
  $metadata: {},
  stage: {
    activeSessionId: 'activeSessionId',
    arn: 'arn',
    name: 'name',
    tags: {
      stageOwnerChannelArn: 'stageOwnerChannelArn'
    }
  }
};

const getStageSpy = jest.spyOn(stageHelpers, 'getStage');
const mockGetStage = (mockData: Promise<GetStageCommandOutput>) =>
  getStageSpy.mockImplementation(() => mockData);

const mockStageId = 'LibZCqmty5Tm';
const url = `/stages/${mockStageId}`;
const defaultRequestParams = { method: 'GET' as const, url };
const server = buildServer();

describe('getStage controller', () => {
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('error handling', () => {
    it('should throw an error if unauthenticated', async () => {
      const getStageFn = getStage as jest.Mock;
      getStageFn.mockRejectedValue(
        'call to ivsrealtime.getStage failed to retrieve the stage'
      );

      const response = await server.inject({
        ...defaultRequestParams,
        headers: { authorization: 'invalidToken' }
      });

      const { message } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(message).toBe('UnauthorizedException');
    });

    it('should throw a 500 error if getStage function fails', async () => {
      const getStageFn = getStage as jest.Mock;
      getStageFn.mockRejectedValue(
        'call to ivsrealtime.getStage failed to retrieve the stage'
      );
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe(UNEXPECTED_EXCEPTION);
    });

    it('should throw a 404 ResourceNotFoundException error if getStage fails to find the requested stage', async () => {
      const getStageFn = getStage as jest.Mock;
      getStageFn.mockRejectedValue({
        name: RESOURCE_NOT_FOUND_EXCEPTION
      });

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(404);
      expect(errType).toBe(RESOURCE_NOT_FOUND_EXCEPTION);
    });
  });

  describe('general cases', () => {
    beforeAll(() => {
      const getStageFn = getStage as jest.Mock;
      getStageFn.mockImplementation(() => ({ statusCode: 200 }));
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should successfully get the stage', async () => {
      mockGetStage(
        Promise.resolve({
          $metadata: mockStageData.$metadata,
          stage: {
            ...mockStageData.stage
          }
        })
      );

      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      expect(response.statusCode).toEqual(200);
    });
  });
});
