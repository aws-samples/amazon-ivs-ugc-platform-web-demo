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
  avatarSrc,
  className,
  profileColor,
  subEl,
  textClassName,
  type,
  username
}) => {
  const shouldInvertColors = isTextColorInverted(profileColor);

  return (
    <div
      className={clsm([
        '[&>img]:rounded-full',
        type === STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED && [
          '[&>img]:hidden',
          '@stage-video-lg/video:[&>img]:block',
          '@stage-video-lg/video:[&>img]:h-6',
          '@stage-video-lg/video:[&>img]:w-6',
          '@stage-video-lg/video:max-w-[120px]',
          '@stage-video-lg/video:pl-1',
          '@stage-video-lg/video:pr-2',
          '@stage-video-lg/video:py-1',
          '@stage-video-md/video:visible',
          '@stage-video-xl/video:[&>img]:h-8',
          '@stage-video-xl/video:[&>img]:w-8',
          '@stage-video-xl/video:max-w-[208px]',
          'invisible',
          'text-white',
          shouldInvertColors
            ? '@stage-video-lg/video:text-white'
            : '@stage-video-lg/video:text-black'
        ],
        'flex',
        'gap-1',
        'items-center',
        'max-w-[108px]',
        'rounded-3xl',
        'w-auto',
        STAGE_PROFILE_TYPES.PARTICIPANTS_MODAL && [
          '[&>img]:ring-2',
          MODAL_PROFILE_COLOR_CLASSNAME_MAPPER[profileColor]
        ],
        PROFILE_COLOR_CLASSNAME_MAPPER[profileColor],
        className
      ])}
    >
      <img src={avatarSrc} alt="" />
      <div className="overflow-hidden">
        <h3
          className={clsm([
            'font-bold',
            'text-p2',
            'truncate',
            type === STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED && [
              'drop-shadow-stage-profile',
              '@stage-video-lg/video:drop-shadow-none',
              '@stage-video-xl/video:font-bold',
              '@stage-video-xl/video:text-p1'
            ],
            textClassName
          ])}
        >
          {username}
        </h3>
        {subEl}
      </div>
    </div>
  );
};

StageProfilePill.defaultProps = {
  type: STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED,
  className: '',
  subEl: null,
  textClassName: ''
};
StageProfilePill.propTypes = {
  avatarSrc: PropTypes.string.isRequired,
  className: PropTypes.string,
  profileColor: PropTypes.string.isRequired,
  subEl: PropTypes.node,
  textClassName: PropTypes.string,
  type: PropTypes.string,
  username: PropTypes.string.isRequired
};

export default StageProfilePill;
