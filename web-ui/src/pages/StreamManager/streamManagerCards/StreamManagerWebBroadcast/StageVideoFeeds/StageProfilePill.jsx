import PropTypes from 'prop-types';

import { clsm, isTextColorInverted } from '../../../../../utils';

/*
  This color mapper to is added to fix a problem with Tailwind container queries when using string literals. 
  String literals caused the package to not recognize the class name. To solve this, 
  we've added a mapper for all the profile colors.
*/
const PROFILE_COLOR_CLASSNAME_MAPPER = {
  blue: '@stage-video-lg/video:bg-profile-blue',
  purple: '@stage-video-lg/video:bg-profile-purple',
  yellow: '@stage-video-lg/video:bg-profile-yellow',
  green: '@stage-video-lg/video:bg-profile-green',
  salmon: '@stage-video-lg/video:bg-profile-salmon',
  turquoise: '@stage-video-lg/video:bg-profile-turquoise',
  lavender: '@stage-video-lg/video:bg-profile-lavender'
};

const MODAL_PROFILE_COLOR_CLASSNAME_MAPPER = {
  blue: '[&>img]:ring-profile-blue',
  purple: '[&>img]:ring-profile-purple',
  yellow: '[&>img]:ring-profile-yellow',
  green: '[&>img]:ring-profile-green',
  salmon: '[&>img]:ring-profile-salmon',
  turquoise: '[&>img]:ring-profile-turquoise',
  lavender: '[&>img]:ring-profile-lavender'
};

export const STAGE_PROFILE_TYPES = {
  FULLSCREEN_VIDEO_FEED: 'fullScreenVideoFeed',
  PARTICIPANTS_MODAL: 'participantsModal'
};

const StageProfilePill = ({
  profileColor,
  avatarSrc,
  username,
  type,
  className,
  isScreenshare
}) => {
  const shouldInvertColors = isTextColorInverted(profileColor);

  return (
    <div
      className={clsm([
        '[&>h3]:drop-shadow-xl',
        '[&>h3]:font-bold',
        '[&>h3]:text-p2',
        '[&>h3]:truncate',
        '[&>img]:rounded-full',
        type === STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED && [
          '[&>img]:hidden',
          '@stage-video-lg/video:[&>h3]:drop-shadow-none',
          '@stage-video-lg/video:[&>img]:block',
          '@stage-video-lg/video:[&>img]:h-6',
          '@stage-video-lg/video:[&>img]:w-6',
          '@stage-video-lg/video:max-w-[120px]',
          '@stage-video-lg/video:pl-1',
          '@stage-video-lg/video:pr-2',
          '@stage-video-lg/video:py-1',
          '@stage-video-md/video:visible',
          '@stage-video-xl/video:[&>h3]:font-bold',
          '@stage-video-xl/video:[&>h3]:text-p1',
          '@stage-video-xl/video:[&>img]:h-8',
          '@stage-video-xl/video:[&>img]:w-8',
          '@stage-video-xl/video:max-w-[168px]',
          'invisible',
          'text-white',
          shouldInvertColors
            ? '@stage-video-lg/video:text-white'
            : '@stage-video-lg/video:text-black'
        ],
        'flex',
        'gap-1',
        'items-center',
        'max-w-[80px]',
        'rounded-3xl',
        'w-auto',
        STAGE_PROFILE_TYPES.PARTICIPANTS_MODAL && [
          '[&>img]:ring-2',
          MODAL_PROFILE_COLOR_CLASSNAME_MAPPER[profileColor]
        ],
        !isScreenshare && PROFILE_COLOR_CLASSNAME_MAPPER[profileColor],
        className,
        isScreenshare && ['!text-white', '![&>h3]:drop-shadow-xl']
      ])}
    >
      {!isScreenshare && <img src={avatarSrc} alt="" />}
      <h3>{username}</h3>
    </div>
  );
};

StageProfilePill.defaultProps = {
  type: STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED,
  className: '',
  profileColor: '',
  avatarSrc: '',
  isScreenshare: false
};
StageProfilePill.propTypes = {
  profileColor: PropTypes.string,
  avatarSrc: PropTypes.string,
  username: PropTypes.string.isRequired,
  isScreenshare: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.string
};

export default StageProfilePill;
