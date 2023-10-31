import { GetItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { GetStageCommandOutput } from '@aws-sdk/client-ivs-realtime';
import { handleDisconnectParticipant } from '../helpers';
import { injectAuthorizedRequest } from '../../testUtils';
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

const url = '/stages/disconnectParticipant';
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
      const disconnectParticipant = handleDisconnectParticipant as jest.Mock;
      disconnectParticipant.mockRejectedValue(
        'call to ivsrealtime.disconnectParticipant failed to disconnect participant from stage'
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

    it('should throw an error if disconnectParticipant function fails', async () => {
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe('UnexpectedException');
    });

    it('should throw an error if participantId is null', async () => {
      mockGetUser(Promise.resolve(mockUserData));
      mockGetStage(Promise.resolve(mockStageData));
      const response = await injectAuthorizedRequest(
        server,
        defaultRequestParams
      );

      const { __type: errType } = JSON.parse(response.payload);

      expect(response.statusCode).toBe(500);
      expect(errType).toBe('UnexpectedException');
    });
  });

  describe('general cases', () => {
    beforeAll(() => {
      const disconnectParticipant = handleDisconnectParticipant as jest.Mock;
      disconnectParticipant.mockImplementation(() => ({ statusCode: 200 }));
    });

    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should successfully disconnect the participant', async () => {
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

      const participantId = 'participant-id';

      const response = await injectAuthorizedRequest(server, {
        ...defaultRequestParams,
        body: { participantId }
      });

      const res = JSON.parse(response.payload);

      expect(response.statusCode).toEqual(200);
      expect(res).toEqual({
        message: `Participant, with participantId: ${participantId}, has been kicked out of the session.`
      });
    });
  });
});
