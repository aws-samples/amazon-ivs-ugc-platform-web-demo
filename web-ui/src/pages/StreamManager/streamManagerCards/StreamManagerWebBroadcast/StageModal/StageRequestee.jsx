import PropTypes from 'prop-types';

import { useEffect, useState } from 'react';

import Button from '../../../../../components/Button';
import { CheckCircle, Delete } from '../../../../../assets/icons';
import StageProfilePill, {
  STAGE_PROFILE_TYPES
} from '../StageVideoFeeds/StageProfilePill';
import { clsm } from '../../../../../utils';
import { getAvatarSrc } from '../../../../../helpers';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { streamManager as $streamManagerContent } from '../../../../../content';
import Tooltip from '../../../../../components/Tooltip';
import { useGlobalStage } from '../../../../../contexts/Stage';
import { useAppSync } from '../../../../../contexts/AppSync';
import channelEvents from '../../../../../contexts/AppSync/channelEvents';

const $content = $streamManagerContent.stream_manager_stage.participants_modal;

const elapsedSinceParagraphClasses = [
  'text-p1',
  'dark:text-[#B4B6BF]',
  'text-[#595959]'
];

const elapsedTime = (requestSentTime) => {
  const currentTime = Date.now();
  const timeDifference = currentTime - Number(requestSentTime);

  if (timeDifference < 3600000) {
    const minutes = Math.floor(timeDifference / 60000);
    if (minutes < 1) return `1 ${$content.min_ago}`;
    return `${minutes <= 1 ? 1 : minutes} ${$content.min_ago}`;
  } else {
    const hours = Math.floor(timeDifference / 3600000);
    return `${hours} ${$content.hr_ago}`;
  }
};

const StageRequestee = ({ requestee }) => {
  const { isTouchscreenDevice } = useResponsiveDevice();
  const { publish } = useAppSync();
  const { deleteRequestToJoin } = useGlobalStage();

  const {
    username,
    profileColor,
    channelId,
    channelAssetUrls,
    channelAssetsAvatarUrl = undefined,
    avatar,
    sent
  } = requestee;

  const [timeElapsedSince, setTimeElapsedSince] = useState(elapsedTime(sent));
  const avatarSrc = getAvatarSrc({
    avatar,
    channelAssetUrls,
    channelAssetsAvatarUrl
  });

  useEffect(() => {
    const timerId = setInterval(() => {
      const elapsedSince = elapsedTime(sent);
      setTimeElapsedSince(elapsedSince);
    }, 60 * 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [sent]);

  const handleAcceptRequest = () => {
    deleteRequestToJoin(channelId);

    publish(
      channelId,
      JSON.stringify({
        type: channelEvents.STAGE_HOST_ACCEPT_REQUEST_TO_JOIN
      })
    );
  };

  const handleRejectRequest = () => {
    deleteRequestToJoin(channelId);

    publish(
      channelId,
      JSON.stringify({
        type: channelEvents.STAGE_HOST_DELETE_REQUEST_TO_JOIN
      })
    );
  };

  return (
    <div
      className={clsm([
        'flex',
        'h-11',
        'items-center',
        'my-8',
        'gap-4',
        'justify-between'
      ])}
    >
      <StageProfilePill
        avatarSrc={avatarSrc}
        profileColor={profileColor}
        username={username}
        type={STAGE_PROFILE_TYPES.PARTICIPANTS_MODAL}
        className={clsm([
          '[&>img]:h-11',
          '[&>img]:w-11',
          'gap-4',
          'max-w-none',
          'min-w-[136px]',
          'w-full'
        ])}
        textClassName="text-[15px]"
        subEl={
          <p
            className={clsm([
              elapsedSinceParagraphClasses,
              'sm:block',
              'hidden',
              'truncate'
            ])}
          >
            {timeElapsedSince}
          </p>
        }
      />
      <div
        className={clsm([
          'flex',
          'sm:justify-end',
          'justify-between',
          'w-full',
          'max-w-[200px]',
          'min-w-[96px]',
          'items-center'
        ])}
      >
        <p className={clsm([elapsedSinceParagraphClasses, 'sm:hidden'])}>
          {timeElapsedSince}
        </p>
        <div className={clsm(['flex', 'space-x-2'])}>
          <Tooltip
            key="confirm-request-tooltip"
            position="below"
            translate={{ y: -2 }}
            message={$content.confirm}
          >
            <Button
              ariaLabel="Confirm request"
              className={clsm([
                'w-11',
                'h-11',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-black',
                'dark:bg-darkMode-gray',
                !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                'dark:focus:bg-darkMode-gray',
                'bg-lightMode-gray'
              ])}
              onClick={handleAcceptRequest}
              variant="icon"
            >
              <CheckCircle />
            </Button>
          </Tooltip>
          <Tooltip
            key="delete-request-tooltip"
            position="below"
            translate={{ y: -2 }}
            message={$content.delete}
          >
            <Button
              ariaLabel="Delete request"
              className={clsm([
                'w-11',
                'h-11',
                'dark:[&>svg]:fill-white',
                '[&>svg]:fill-black',
                'dark:bg-darkMode-gray',
                !isTouchscreenDevice && 'hover:bg-lightMode-gray-hover',
                'dark:focus:bg-darkMode-gray',
                'bg-lightMode-gray'
              ])}
              onClick={handleRejectRequest}
              variant="icon"
            >
              <Delete />
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

StageRequestee.propTypes = {
  requestee: PropTypes.shape({
    username: PropTypes.string,
    profileColor: PropTypes.string,
    channelId: PropTypes.string,
    channelAssetUrls: PropTypes.object,
    channelAssetsAvatarUrl: PropTypes.string,
    avatar: PropTypes.string,
    sent: PropTypes.string
  }).isRequired
};

export default StageRequestee;
