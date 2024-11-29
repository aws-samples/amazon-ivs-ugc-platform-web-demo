import PropTypes from 'prop-types';
import { createContext, useCallback, useEffect, useMemo } from 'react';
import { graphqlOperation, API } from '@aws-amplify/api';
import { useDispatch, useSelector } from 'react-redux';

import { publishDoc, subscribeDoc } from './graphql';
import useContextHook from '../useContextHook';
import { useUser } from '../User';
import { useNotif } from '../Notification';
import channelEvents from './channelEvents';
import { streamManager as $streamManagerContent } from '../../content';
import { Outlet, useLocation } from 'react-router-dom';
import { useChannel } from '../Channel';
import { extractChannelIdfromChannelArn } from '../../utils';
import {
  addToCollaborateRequestList,
  removeFromCollaborateRequestList,
  updateCollaborateStates,
  updateError
} from '../../reducers/shared';
import { updateDisplayMediaStates } from '../../reducers/streamManager';

const $contentNotification =
  $streamManagerContent.stream_manager_stage.notifications;

const Context = createContext(null);
Context.displayName = 'AppSync';

export const Provider = ({ children = null }) => {
  const dispatch = useDispatch();
  const { displayMedia } = useSelector((state) => state.streamManager);
  const { userData } = useUser();
  const { notifyNeutral, notifyError } = useNotif();
  const { pathname } = useLocation();
  const { channelData } = useChannel();
  const channelId = channelData?.channelArn
    ? extractChannelIdfromChannelArn(channelData.channelArn)
    : null;
  const isChannelOwner =
    channelId &&
    userData?.channelId &&
    channelId.toLowerCase() === userData.channelId.toLowerCase();

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
          if (!isChannelOwner) return;

          dispatch(removeFromCollaborateRequestList(channelEvent.channelId));
          break;
        case channelEvents.STAGE_REQUEST_TO_JOIN:
          if (!isChannelOwner) return;

          dispatch(addToCollaborateRequestList(channelEvent));
          break;
        case channelEvents.STAGE_HOST_ACCEPT_REQUEST_TO_JOIN:
          if (!isChannelOwner) {
            notifyNeutral($contentNotification.neutral.joining_session, {
              asPortal: true
            });

            dispatch(
              updateCollaborateStates({
                isJoining: true,
                stageId: channelData.stageId
              })
            );
          }
          break;
        case channelEvents.STAGE_HOST_DELETE_REQUEST_TO_JOIN:
          dispatch(updateCollaborateStates({ isRequesting: false }));
          break;
        case channelEvents.STAGE_PARTICIPANT_KICKED:
          break;
        case channelEvents.HOST_REMOVES_PARTICIPANT_SCREEN_SHARE:
          if (displayMedia.participantId !== channelEvent.participantId) return;

          dispatch(
            updateError(
              $contentNotification.error.your_screen_share_has_been_removed
            )
          );
          dispatch(updateDisplayMediaStates({ isScreenSharing: false }));

          break;
        default:
          return;
      }
    });

    return () => subscription.unsubscribe();
  }, [
    channelData,
    isChannelOwner,
    notifyNeutral,
    pathname,
    subscribe,
    notifyError,
    userData?.channelId,
    dispatch,
    displayMedia.participantId
  ]);

  const value = useMemo(
    () => ({
      publish
    }),
    [publish]
  );

  return (
    <Context.Provider value={value}>{children || <Outlet />}</Context.Provider>
  );
};

Provider.propTypes = { children: PropTypes.node };

export const useAppSync = () => useContextHook(Context);
