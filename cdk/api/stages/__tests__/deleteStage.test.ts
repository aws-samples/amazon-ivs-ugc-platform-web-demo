import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { GetStageCommandOutput } from '@aws-sdk/client-ivs-realtime';
import { injectAuthorizedRequest } from '../../testUtils';
import { STAGE_END_EXCEPTION } from '../../shared/constants';
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

const verifyUserIsStageHostSpy = jest.spyOn(
  stageHelpers,
  'verifyUserIsStageHost'
);
const mockVerifyUserIsStageHost = () =>
  verifyUserIsStageHostSpy.mockImplementation(() => {
    const { channelArn } = mockUserData;
    return Promise.resolve({ isStageHost: true, stageId: channelArn });
  });

jest.mock('../helpers');

const getUnmarshall = jest.spyOn(utilDynamoDB, 'unmarshall');
const mockGetUnmarshall = (mockData: IMockUnmarshalledUserData) =>
  getUnmarshall.mockImplementation(() => mockData);

jest.mock('@aws-sdk/util-dynamodb');

const url = '/stages/end';
const defaultRequestParams = { method: 'PUT' as const, url };
const server = buildServer();

describe('endStage controller', () => {
  beforeAll(() => {
    mockGetUnmarshall(mockUserData);
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('error handling', () => {
    it('should throw an error if unauthenticated', async () => {
      const response = await server.inject({
        ...defaultRequestParams,
        headers: { authorization: 'invalidToken' }
      });

      const { message } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(message).toBe('UnauthorizedException');
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
      expect(errType).toBe(STAGE_END_EXCEPTION);
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
      expect(errType).toBe(STAGE_END_EXCEPTION);
    });
  });

  describe('general cases', () => {
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
      mockVerifyUserIsStageHost();

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
