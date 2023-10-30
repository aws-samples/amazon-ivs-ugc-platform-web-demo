import PropTypes from 'prop-types';

import Button from '../../../../../components/Button';
import {
  Close,
  MicOff,
  MicOn,
  VideoCamera,
  VideoCameraOff
} from '../../../../../assets/icons';
import StageProfilePill, {
  STAGE_PROFILE_TYPES
} from '../StageVideoFeeds/StageProfilePill';
import { clsm, noop } from '../../../../../utils';
import { getAvatarSrc } from '../../../../../helpers';
import { useResponsiveDevice } from '../../../../../contexts/ResponsiveDevice';
import { BREAKPOINTS } from '../../../../../constants';

const StageParticipant = ({ participant }) => {
  const { isTouchscreenDevice, isDesktopView, currentBreakpoint } =
    useResponsiveDevice();
  const { participantId, attributes, isCameraHidden, isMicrophoneMuted } =
    participant;
  const { username, profileColor } = attributes;
  const avatarSrc = getAvatarSrc(attributes);

  return (
    <div
      className={clsm(['flex', 'h-11', 'items-center', 'my-8'])}
      key={participantId}
    >
      <StageProfilePill
        avatarSrc={avatarSrc}
        profileColor={profileColor}
        username={username}
        type={STAGE_PROFILE_TYPES.PARTICIPANTS_MODAL}
        className={clsm([
          '[&>img]:w-11',
          '[&>img]:h-11',
          'gap-4',
          'max-w-fit',
          isDesktopView ? 'mr-48' : ['mr-auto', 'max-w-[177px]'],
          currentBreakpoint === BREAKPOINTS.xxs && 'max-w-[90px]'
        ])}
      />
      <div
        className={clsm([
          'bg-darkMode-gray-dark',
          'flex',
          'gap-3',
          'p-2',
          '[&>svg]:fill-white',
          '[&>svg]:w-5',
          '[&>svg]:h-5',
          'rounded-[20px]',
          'h-[36px]',
          'mr-auto'
        ])}
      >
        {isCameraHidden ? (
          <VideoCameraOff className="!fill-darkMode-gray" />
        ) : (
          <VideoCamera />
        )}
        {isMicrophoneMuted ? (
          <MicOff className="!fill-darkMode-gray" />
        ) : (
          <MicOn />
        )}
      </div>
      <Button
        ariaLabel="Reject participants"
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
        onClick={noop}
        variant="icon"
      >
        <Close />
      </Button>
    </div>
  );
};

StageParticipant.propTypes = {
  participant: PropTypes.shape({
    participantId: PropTypes.string,
    attributes: PropTypes.shape({
      username: PropTypes.string,
      profileColor: PropTypes.string
    }),
    isCameraHidden: PropTypes.bool,
    isMicrophoneMuted: PropTypes.bool
  }).isRequired
};

export default StageParticipant;
