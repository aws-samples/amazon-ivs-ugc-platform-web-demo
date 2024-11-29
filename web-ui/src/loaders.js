import { defer, redirect } from 'react-router-dom';

import { channelAPI, channelsAPI, stagesAPI } from './api';
import {
  clearCollaborate,
  resetSharedStates,
  updateCollaborateStates,
  updateError
} from './reducers/shared';
import { waitForReduxRehydration } from './utils';
import store from './store';
import { COLLABORATE_ROUTE_PATH, PARTICIPANT_TYPES } from './constants';
import {
  resetStreamManagerStates,
  updateDisplayMediaStates
} from './reducers/streamManager';
import { StageFactory } from './contexts/StageManager';
import { streamManager as $streamManagerContent } from './content';
import { STAGE_ID_URL_PARAM } from './helpers/stagesHelpers';

const $streamManagerStageNotifications =
  $streamManagerContent.stream_manager_stage.notifications;

const { destroyStages } = StageFactory;

async function stateCleanupLoader({ request }) {
  const { pathname } = new URL(request.url);
  const dispatch = store.dispatch;

  destroyStages();

  /**
   * Only when on the stream manager routes should the loader
   * wait for the redux shared slice to hydrate to get the collaborate "isLeaving" state
   * Ony when "isLeaving" is false should the shared states be reset.
   * A case for this is when the user first loads the stream manager page.
   */
  if (pathname.includes('/manager')) {
    await waitForReduxRehydration('shared');
    const {
      shared: {
        collaborate: { isLeaving }
      }
    } = store.getState();

    if (!isLeaving) dispatch(resetSharedStates());
  }

  dispatch(resetStreamManagerStates());

  return null;
}

async function stageLoader({ request }) {
  await waitForReduxRehydration('shared');
  const {
    shared: {
      collaborate: {
        stageId: storedStageId,
        participantType: storedParticipantType
      }
    }
  } = store.getState();
  const dispatch = store.dispatch;
  const { pathname, search } = new URL(request.url);
  const searchParams = new URLSearchParams(search);

  let stageId = storedStageId;
  let participantType = storedParticipantType;

  try {
    if (pathname !== COLLABORATE_ROUTE_PATH) {
      throw new Error(`Pathname is incorrect. Pathname: ${pathname}`);
    }

    // If the "STAGE_ID_URL_PARAM" search params has a value, set the stageId as the parameter value and set participant type as "invited"
    const stageIdParam = searchParams.get(STAGE_ID_URL_PARAM);
    if (stageIdParam) {
      stageId = stageIdParam;
      participantType = PARTICIPANT_TYPES.INVITED;
    }

    if (
      [PARTICIPANT_TYPES.REQUESTED, PARTICIPANT_TYPES.INVITED].includes(
        participantType
      )
    ) {
      const { result, error } = await stagesAPI.getParticipationToken({
        stageId,
        participantType
      });
      if (result) {
        const {
          hostData,
          display: { participantId }
        } = result;
        // Save values in the store to use on the stream manager page
        dispatch(
          updateCollaborateStates({
            isJoining: true,
            stageId: stageId,
            participantType,
            ...(hostData ? { host: hostData } : {})
          })
        );
        dispatch(updateDisplayMediaStates({ participantId }));

        return result;
      }
      if (error) {
        throw new Error(
          `Failed to get participant token with error: ${JSON.stringify(error)}`
        );
      }
    } else if (participantType === PARTICIPANT_TYPES.HOST) {
      const { result, error } = await stagesAPI.createStage();
      if (result) {
        const {
          stageId,
          participantRole,
          display: { participantId }
        } = result;
        const isHost = participantRole === PARTICIPANT_TYPES.HOST;
        // Save stageIds in the store to use on the stream manager page
        dispatch(
          updateCollaborateStates({
            stageId: stageId,
            participantType: participantRole,
            isJoining: !isHost
          })
        );
        dispatch(updateDisplayMediaStates({ participantId }));

        return result;
      }
      if (error) {
        dispatch(
          updateError(
            $streamManagerStageNotifications.error.unable_to_create_session
          )
        );
        throw new Error(
          `Failed to create stage with error: ${JSON.stringify(error)}`
        );
      }
    } else {
      return redirect('/manager');
    }
  } catch (error) {
    console.error(error.message);
    throw redirect('/manager');
  }
}

function channelStageLoader({ params }) {
  const dispatch = store.dispatch;

  return defer({
    channelStageResponse: new Promise((resolve, reject) => {
      channelsAPI
        .getUserChannelData(params.username)
        .then((response) => {
          const { result: { stageId } = {}, error: getChannelDataError } =
            response;

          if (!stageId) {
            /**
             * When the channel owner does not have a live collaborate session,
             * Clear the Redux shared slice collaborate state
             */
            dispatch(clearCollaborate());

            return resolve(null);
          }

          if (getChannelDataError) throw getChannelDataError;

          return stagesAPI.getSpectatorToken(stageId);
        })
        .then((response) => {
          const { result: stageConfig, error: getTokenError } = response;

          /**
           * Once the collaborate spectator token has been created,
           * Set the collaborate state for the spectator participant
           */
          dispatch(
            updateCollaborateStates({
              isRequesting: false,
              isJoining: false,
              participantType: PARTICIPANT_TYPES.SPECTATOR,
              stageId: stageConfig.stageId
            })
          );

          if (stageConfig) return resolve(stageConfig);

          if (getTokenError) throw getTokenError;
        })
        .catch(reject);
    })
  });
}

async function managerLoader({ request }) {
  const dispatch = store.dispatch;
  const { pathname } = new URL(request.url);
  if (pathname === COLLABORATE_ROUTE_PATH) return {};
  const { result, error } = await channelAPI.getUserData();

  if (result) {
    const { stageId } = result;

    if (stageId) {
      dispatch(
        updateCollaborateStates({
          participantType: PARTICIPANT_TYPES.HOST,
          stageId
        })
      );
      return redirect(COLLABORATE_ROUTE_PATH);
    } else {
      return {};
    }
  }

  if (error) return {};
}

export { stageLoader, channelStageLoader, managerLoader, stateCleanupLoader };
