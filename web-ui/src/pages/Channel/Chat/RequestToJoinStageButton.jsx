import { useDispatch, useSelector } from 'react-redux';
import React, { useCallback, useEffect } from 'react';

import Button from '../../../components/Button/Button';
import { RequestInvite } from '../../../assets/icons';
import channelEvents from '../../../contexts/AppSync/channelEvents';
import Tooltip from '../../../components/Tooltip/Tooltip';
import { channelAPI } from '../../../api';
import { useAppSync } from '../../../contexts/AppSync';
import { useChannel } from '../../../contexts/Channel';
import { useUser } from '../../../contexts/User';
import { channel as $channelContent } from '../../../content';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { clsm, extractChannelIdfromChannelArn } from '../../../utils';
import Spinner from '../../../components/Spinner';
import { useNavigate } from 'react-router-dom';
import { useStageManager } from '../../../contexts/StageManager';
import {
  updateCollaborateStates,
  updateError,
  updateSuccess
} from '../../../reducers/shared';
import { COLLABORATE_ROUTE_PATH, PARTICIPANT_TYPES } from '../../../constants';

const RequestToJoinStageButton = () => {
  const dispatch = useDispatch();
  const { collaborate } = useSelector((state) => state.shared);
  const navigate = useNavigate();
  const { publish } = useAppSync();
  const { channelData } = useChannel();
  const { userData, isSessionValid } = useUser();
  const { isTouchscreenDevice, isMobileView } = useResponsiveDevice();
  const { user: userStage = null } = useStageManager() || {};
  const publishingUserParticipants =
    userStage?.getParticipants({
      isPublishing: true,
      canSubscribeTo: true
    }) || [];

  let channelId;

  if (channelData?.channelArn) {
    channelId = extractChannelIdfromChannelArn(channelData?.channelArn);
  }
  // Consistent with FloatingNav
  const isMenuButtonVisible = isSessionValid && isMobileView;

  const revokeRequestToJoinStage = useCallback(() => {
    dispatch(
      updateCollaborateStates({
        isRequesting: false
      })
    );
    publish(
      channelId,
      JSON.stringify({
        type: channelEvents.STAGE_REVOKE_REQUEST_TO_JOIN,
        channelId: userData.channelId.toLowerCase()
      })
    );
  }, [channelId, dispatch, publish, userData.channelId]);

  const requestToJoin = async () => {
    if (collaborate.isJoining) return;

    // If request has been already submitted, the request will be revoked
    if (collaborate.isRequesting) {
      return revokeRequestToJoinStage();
    }

    const { result, error } = await channelAPI.getChannelLiveStatus();

    const displayErrorNotification =
      result?.isBroadcasting || result?.isStageActive || !!error;

    if (displayErrorNotification) {
      if (error) console.error(error);
      if (result?.isStageActive || result?.isBroadcasting)
        console.error(
          'Cannot request to join: the user already has an active live stream or stage session.'
        );
      dispatch(
        updateError(
          $channelContent.notifications.error.request_to_join_stage_fail
        )
      );
    } else {
      const {
        username,
        avatar,
        channelAssetUrls,
        color: profileColor,
        channelAssetsAvatarUrl = undefined
      } = userData;

      dispatch(
        updateCollaborateStates({
          isRequesting: true,
          participantType: PARTICIPANT_TYPES.REQUESTED
        })
      );
      publish(
        channelId,
        JSON.stringify({
          type: channelEvents.STAGE_REQUEST_TO_JOIN,
          channelId: userData.channelId.toLowerCase(),
          username,
          avatar,
          channelAssetUrls,
          channelAssetsAvatarUrl,
          profileColor,
          sent: Date.now().toString()
        })
      );
      dispatch(
        updateSuccess(
          $channelContent.notifications.success.request_to_join_stage_success
        )
      );
    }
  };

  /**
   * Automatically navigate user to the stream manager collaborate path with delay
   */
  useEffect(() => {
    if (collaborate.isJoining) {
      setTimeout(() => {
        navigate(COLLABORATE_ROUTE_PATH);
      }, 1500);
    }
  }, [collaborate.isJoining, navigate]);

  const icon = collaborate.isJoining ? <Spinner /> : <RequestInvite />;

  const message = collaborate.isJoining
    ? ''
    : collaborate.isRequesting
      ? $channelContent.request_to_join_stage_button.tooltip.cancel_request
      : $channelContent.request_to_join_stage_button.tooltip.request_to_join;

  const isUserAlreadyInStage = publishingUserParticipants.some(
    (participant) => participant.attributes.channelId === userData.channelId
  );

  const isDisabled =
    publishingUserParticipants?.length >= 12 || isUserAlreadyInStage;

  return (
    <Tooltip
      shouldKeepMinWidth={false}
      position="above"
      translate={{ y: 2 }}
      message={message}
    >
      <Button
        className={clsm([
          isMenuButtonVisible && 'mr-[56px]',
          collaborate.isJoining && 'pointer-events-none',
          'w-11',
          'h-11',
          'dark:[&>svg]:fill-white',
          '[&>svg]:fill-black',
          'dark:bg-darkMode-gray',
          !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
          'dark:focus:bg-darkMode-gray',
          'bg-lightMode-gray',
          (collaborate.isRequesting || collaborate.isJoining) && [
            'dark:[&>svg]:fill-black',
            'dark:bg-darkMode-blue',
            'dark:focus:bg-darkMode-blue',
            'text-black',
            'bg-lightMode-blue',
            'focus:bg-lightMode-blue',
            !isTouchscreenDevice && [
              'hover:bg-lightMode-blue-hover',
              'dark:hover:bg-darkMode-blue-hover'
            ]
          ]
        ])}
        variant="icon"
        ariaLabel={'test'}
        key="create-stage-control-btn"
        onClick={requestToJoin}
        isDisabled={isDisabled}
      >
        {icon}
      </Button>
    </Tooltip>
  );
};

export default RequestToJoinStageButton;
