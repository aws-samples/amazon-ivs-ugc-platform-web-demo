import { apiBaseUrl, authFetch, unauthFetch } from './utils';

export const getSpectatorToken = async (stageId) =>
  await unauthFetch({
    url: `${apiBaseUrl}/stages/createSpectatorToken/${stageId}`
  });

export const createStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/create`
  });

export const deleteStage = async () =>
  await authFetch({
    url: `${apiBaseUrl}/stages/delete`,
    method: 'PUT'
  });

export const getParticipationToken = async (stageId, participantType) =>
  await authFetch({
    url: `${apiBaseUrl}/stages/createParticipantToken/${stageId}/${participantType}`
  });

export const sendHostDisconnectedMessage = async (hostChannelId) => {
  await authFetch({
    method: 'POST',
    url: `${apiBaseUrl}/stages/sendHostDisconnectedMessage`,
    keepalive: true,
    body: {
      hostChannelId
    }
  });
};

export const disconnectParticipant = async (participantId) => {
  return await authFetch({
    url: `${apiBaseUrl}/stages/disconnectParticipant`,
    method: 'PUT',
    body: { participantId }
  });
};

export const disconnectSpectator = async ({
  participantId,
  participantChannelId,
  stageId
}) => {
  return await authFetch({
    url: `${apiBaseUrl}/stages/disconnectSpectator`,
    method: 'PUT',
    body: { participantId, participantChannelId, stageId }
  });
};
