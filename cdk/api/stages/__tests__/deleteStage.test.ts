import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { GetStageCommandOutput } from '@aws-sdk/client-ivs-realtime';
import { handleDeleteStage } from '../helpers';
import { injectAuthorizedRequest } from '../../testUtils';
import { STAGE_DELETION_EXCEPTION } from '../../shared/constants';
import * as helpers from '../../channel/helpers';
import * as stageHelpers from '../helpers';
import buildServer from '../../buildServer';
import mockUserData from '../__mocks__/mockUserData.json';
import * as utilDynamoDB from '@aws-sdk/util-dynamodb';
import { IMockUnmarshalledUserData } from './createStage.test';

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

jest.mock('../../shared/helpers', () => ({
  ...jest.requireActual('../../shared/helpers'),
  getSecrets: jest.fn(),
  updateDynamoItemAttributes: jest.fn()
}));

const getUserSpy = jest.spyOn(helpers, 'getUser');
const mockGetUser = (mockData: Promise<GetItemCommandOutput>) =>
  getUserSpy.mockImplementation(() => mockData);

const getStageSpy = jest.spyOn(stageHelpers, 'getStage');
const mockGetStage = (mockData: Promise<GetStageCommandOutput>) =>
  getStageSpy.mockImplementation(() => mockData);

jest.mock('../helpers');

const getUnmarshall = jest.spyOn(utilDynamoDB, 'unmarshall');
const mockGetUnmarshall = (mockData: IMockUnmarshalledUserData) =>
  getUnmarshall.mockImplementation(() => mockData);

jest.mock('@aws-sdk/util-dynamodb');

const url = '/stages/delete';
const defaultRequestParams = { method: 'PUT' as const, url };
const server = buildServer();

describe('deleteStage controller', () => {
  beforeAll(() => {
    mockGetUnmarshall(mockUserData);
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('error handling', () => {
    beforeAll(() => {
      const deleteStage = handleDeleteStage as jest.Mock;
      deleteStage.mockRejectedValue(
        'call to ivsrealtime.deleteStage failed to delete the stage'
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

    it('should throw an error if deleteStage function fails', async () => {
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe(STAGE_DELETION_EXCEPTION);
    });

    it('should throw an error if channelArn does not match stage stageOwnerChannelArn', async () => {
      mockGetUser(Promise.resolve(mockUserData));
      mockGetStage(Promise.resolve(mockStageData));
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe(STAGE_DELETION_EXCEPTION);
    });
    it('should throw an error if stageId is null', async () => {
      mockGetUser(Promise.resolve(mockUserData));
      mockGetStage(Promise.resolve(mockStageData));
      mockGetUnmarshall({ ...mockUserData, stageId: null });
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe(STAGE_DELETION_EXCEPTION);
    });
  });

  describe('general cases', () => {
    beforeAll(() => {
      const deleteStage = handleDeleteStage as jest.Mock;
      deleteStage.mockImplementation(() => ({ statusCode: 200 }));
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should successfully delete the stage and update the channel table', async () => {
      const { channelArn } = mockUserData;
      mockGetUser(Promise.resolve(mockUserData));
      mockGetUnmarshall({ ...mockUserData, stageId: channelArn });
      mockGetStage(
        Promise.resolve({
          $metadata: mockStageData.$metadata,
          stage: {
            ...mockStageData.stage,
            tags: {
              stageOwnerChannelArn: channelArn
            }
          }
        })
      );
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const res = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(200);
      expect(res).toEqual({
        message: `Stage, with stageId: ${channelArn}, has been deleted.`
      });
    });
  });
});
