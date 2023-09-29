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

const StageProfilePill = ({ profileColor, avatarSrc, username }) => {
  const shouldInvertColors = isTextColorInverted(profileColor);

  return (
    <div
      className={clsm([
        '[&>h3]:drop-shadow-xl',
        '[&>h3]:font-bold',
        '[&>h3]:text-p2',
        '[&>h3]:truncate',
        '[&>img]:hidden',
        '[&>img]:rounded-full',
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
        'flex',
        'gap-1',
        'invisible',
        'items-center',
        'max-w-[80px]',
        'rounded-3xl',
        'text-white',
        'w-auto',
        shouldInvertColors
          ? '@stage-video-lg/video:text-white'
          : '@stage-video-lg/video:text-black',
        PROFILE_COLOR_CLASSNAME_MAPPER[profileColor]
      ])}
    >
      <img src={avatarSrc} alt="" />
      <h3>{username}</h3>
    </div>
  );
};

StageProfilePill.propTypes = {
  profileColor: PropTypes.string.isRequired,
  avatarSrc: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired
};

export default StageProfilePill;
