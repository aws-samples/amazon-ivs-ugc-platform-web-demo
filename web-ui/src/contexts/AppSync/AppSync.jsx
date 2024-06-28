import { createContext, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { graphqlOperation, API } from '@aws-amplify/api';

import { publishDoc, subscribeDoc } from './graphql';
import useContextHook from '../useContextHook';
import { useUser } from '../User';
import { useNotif } from '../Notification';
import channelEvents from './channelEvents';
import { streamManager as $streamManagerContent } from '../../content';
import { useGlobalStage } from '../Stage';
import { useLocation } from 'react-router-dom';
import { useChannel } from '../Channel';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const Context = createContext(null);
Context.displayName = 'AppSync';

export const Provider = ({ children }) => {
  const { userData } = useUser();
  const { notifyNeutral, notifyError } = useNotif();
  const {
    isHost,
    updateStageRequestList,
    updateRequestingToJoinStage,
    updateHasStageRequestBeenApproved,
    updateIsScreensharePermissionRevoked
  } = useGlobalStage();
  const { pathname } = useLocation();
  const { channelData } = useChannel();

  /**
   * @param  {string} name the name of the channel
   * @param  {Object} data the data to publish to the channel
   */
  const publish = useCallback(async (name, data) => {
    return await API.graphql(graphqlOperation(publishDoc, { name, data }));
  }, []);

  /**
   * @param  {string} name the name of the channel
   * @param  {nextCallback} next callback function that will be called with subscription payload data
   * @param  {function} [error] optional function to handle errors
   * @returns {Observable} an observable subscription object
   */
  const subscribe = useCallback((name, next, error) => {
    return API.graphql(graphqlOperation(subscribeDoc, { name })).subscribe({
      next: ({ provider, value }) => {
        next(value.data.subscribe, provider, value);
      },
      error: error || console.log
    });
  }, []);

  useEffect(() => {
    if (!userData?.channelId) return;

    const channel = userData?.channelId.toLowerCase();
    const subscription = subscribe(channel, ({ data }) => {
      const channelEvent = JSON.parse(data);
      switch (channelEvent?.type) {
        case channelEvents.STAGE_REVOKE_REQUEST_TO_JOIN:
        case channelEvents.STAGE_REQUEST_TO_JOIN:
          if (!isHost) return;

          updateStageRequestList(channelEvent);
          break;
        case channelEvents.STAGE_HOST_ACCEPT_REQUEST_TO_JOIN:
          if (!isHost) {
            notifyNeutral($contentNotification.neutral.joining_session, {
              asPortal: true
            });

            updateHasStageRequestBeenApproved(true);
          }
          break;
        case channelEvents.STAGE_HOST_DELETE_REQUEST_TO_JOIN:
          updateRequestingToJoinStage(false);
          break;
        case channelEvents.STAGE_PARTICIPANT_KICKED:
          if (!isHost) {
            notifyError(
              $contentNotification.error.you_have_been_removed_from_session,
              {
                asPortal: true
              }
            );
          }
          break;
        case channelEvents.HOST_REMOVES_PARTICIPANT_SCREEN_SHARE:
          updateIsScreensharePermissionRevoked(true);
          break;
        default:
          return;
      }
    });

    return () => subscription.unsubscribe();
  }, [
    channelData,
    isHost,
    notifyNeutral,
    pathname,
    subscribe,
    updateHasStageRequestBeenApproved,
    notifyError,
    updateStageRequestList,
    updateRequestingToJoinStage,
    userData?.channelId,
    updateIsScreensharePermissionRevoked
  ]);

  const value = useMemo(
    () => ({
      publish
    }),
    [publish]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

Provider.propTypes = { children: PropTypes.node.isRequired };

export const useAppSync = () => useContextHook(Context);
