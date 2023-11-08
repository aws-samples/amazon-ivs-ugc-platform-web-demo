import React, { useEffect } from 'react';

import Button from '../../../components/Button/Button';
import { RequestInvite } from '../../../assets/icons';
import channelEvents from '../../../contexts/AppSync/channelEvents';
import Tooltip from '../../../components/Tooltip/Tooltip';
import { channelAPI } from '../../../api';
import { useGlobalStage } from '../../../contexts/Stage';
import { useAppSync } from '../../../contexts/AppSync';
import { useChannel } from '../../../contexts/Channel';
import { useUser } from '../../../contexts/User';
import { channel as $channelContent } from '../../../content';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { clsm, extractChannelIdfromChannelArn } from '../../../utils';
import Spinner from '../../../components/Spinner';
import { useNavigate } from 'react-router-dom';

const RequestToJoinStageButton = () => {
  const {
    requestingToJoinStage,
    updateRequestingToJoinStage,
    updateError,
    updateSuccess,
    participants,
    hasStageRequestBeenApproved,
    updateHasStageRequestBeenApproved
  } = useGlobalStage();
  const { publish } = useAppSync();
  const { channelData } = useChannel();
  const { userData, isSessionValid } = useUser();
  const { isTouchscreenDevice, isMobileView } = useResponsiveDevice();
  const navigate = useNavigate();

  let channelId;

  if (channelData?.channelArn) {
    channelId = extractChannelIdfromChannelArn(channelData?.channelArn);
  }
  // Consistent with FloatingNav
  const isMenuButtonVisible = isSessionValid && isMobileView;

  const requestToJoin = async () => {
    if (hasStageRequestBeenApproved) return;

    if (requestingToJoinStage) {
      updateRequestingToJoinStage(false);
      publish(
        channelId,
        JSON.stringify({
          type: channelEvents.STAGE_REVOKE_REQUEST_TO_JOIN,
          channelId: userData.channelId.toLowerCase()
        })
      );

      return;
    }

    const { result: streamStatus, error } =
      await channelAPI.getStreamLiveStatus();

    if (streamStatus?.isLive || !!error) {
      updateError({
        message: $channelContent.notifications.error.request_to_join_stage_fail,
        err: error
      });
    } else {
      const {
        username,
        avatar,
        channelAssetUrls,
        color: profileColor,
        channelAssetsAvatarUrl = undefined
      } = userData;
      updateSuccess(
        $channelContent.notifications.success.request_to_join_stage_success
      );
      updateRequestingToJoinStage(true);
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
    }
  };

  useEffect(() => {
    if (hasStageRequestBeenApproved) {
      setTimeout(() => {
        updateHasStageRequestBeenApproved(false);
        updateRequestingToJoinStage(false);
        navigate('/manager', {
          state: { isJoiningStage: true, stageId: channelData?.stageId }
        });
      }, 1500);
    }
  }, [
    channelData?.stageId,
    hasStageRequestBeenApproved,
    navigate,
    updateHasStageRequestBeenApproved,
    updateRequestingToJoinStage
  ]);

  const icon = hasStageRequestBeenApproved ? <Spinner /> : <RequestInvite />;

  const message = hasStageRequestBeenApproved
    ? ''
    : requestingToJoinStage
    ? $channelContent.request_to_join_stage_button.tooltip.cancel_request
    : $channelContent.request_to_join_stage_button.tooltip.request_to_join;

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
          hasStageRequestBeenApproved && 'pointer-events-none',
          'w-11',
          'h-11',
          'dark:[&>svg]:fill-white',
          '[&>svg]:fill-black',
          'dark:bg-darkMode-gray',
          !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
          'dark:focus:bg-darkMode-gray',
          'bg-lightMode-gray',
          (requestingToJoinStage || hasStageRequestBeenApproved) && [
            'dark:[&>svg]:fill-black',
            'dark:bg-darkMode-blue',
            'dark:focus:bg-darkMode-blue',
            'text-black',
            'dark:hover:bg-darkMode-blue-hover'
          ]
        ])}
        variant="icon"
        ariaLabel={'test'}
        key="create-stage-control-btn"
        onClick={requestToJoin}
        isDisabled={participants?.size >= 12}
      >
        {icon}
      </Button>
    </Tooltip>
  );
};

export default RequestToJoinStageButton;
