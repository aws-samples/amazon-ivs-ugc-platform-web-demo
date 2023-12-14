import PropTypes from 'prop-types';

import { clsm, isTextColorInverted } from '../../../../../utils';
import { streamManager as $content } from '../../../../../content';

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

const textStyles = [
  '@stage-video-lg/screenshare:drop-shadow-none',
  '@stage-video-lg/video:drop-shadow-none',
  '@stage-video-xl/screenshare:font-bold',
  '@stage-video-xl/screenshare:text-p1',
  '@stage-video-xl/video:font-bold',
  '@stage-video-xl/video:text-p1',
  'drop-shadow-xl',
  'font-bold',
  'text-p2'
];

export const STAGE_PROFILE_TYPES = {
  FULLSCREEN_VIDEO_FEED: 'fullScreenVideoFeed',
  PARTICIPANTS_MODAL: 'participantsModal'
};

const $streamManagerStage = $content.stream_manager_stage;

const StageProfilePill = ({
  profileColor,
  avatarSrc,
  username,
  type,
  isScreenshare
}) => {
  const shouldInvertColors = !!profileColor
    ? isTextColorInverted(profileColor)
    : true;

  return (
    <div
      className={clsm([
        '[&>img]:rounded-full',
        type === STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED && [
          '[&>img]:hidden',
          // @container video
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
          '@stage-video-xl/video:max-w-[168px]',
          // @container screenshare
          '@stage-video-lg/screenshare:[&>img]:block',
          '@stage-video-lg/screenshare:[&>img]:h-6',
          '@stage-video-lg/screenshare:[&>img]:w-6',
          '@stage-video-lg/screenshare:pl-1',
          '@stage-video-lg/screenshare:pr-2',
          '@stage-video-lg/screenshare:py-1',
          '@stage-video-md/screenshare:visible',
          '@stage-video-xl/screenshare:[&>img]:h-8',
          '@stage-video-xl/screenshare:[&>img]:w-8',
          'invisible',
          isScreenshare ? ['text-black', 'dark:text-white'] : 'text-white',
          isScreenshare
            ? ''
            : shouldInvertColors
            ? [
                '@stage-video-lg/video:text-white',
                '@stage-video-lg/screenshare:text-white'
              ]
            : [
                '@stage-video-lg/video:text-black',
                '@stage-video-lg/screenshare:text-black'
              ]
        ],
        'flex',
        'gap-1',
        'items-center',
        !isScreenshare && 'max-w-[80px]',
        'rounded-3xl',
        'w-auto',
        STAGE_PROFILE_TYPES.PARTICIPANTS_MODAL &&
          !!profileColor && [
            '[&>img]:ring-2',
            MODAL_PROFILE_COLOR_CLASSNAME_MAPPER[profileColor]
          ],
        !isScreenshare &&
          !!profileColor &&
          PROFILE_COLOR_CLASSNAME_MAPPER[profileColor]
      ])}
    >
      {!isScreenshare && <img src={avatarSrc} alt="" />}
      <h3
        className={clsm([
          '@stage-video-lg/screenshare:max-w-[120px]',
          '@stage-video-xl/screenshare:max-w-[168px]',
          'truncate',
          textStyles
        ])}
      >
        {username}
      </h3>
      {isScreenshare && (
        <h3 className={clsm(['whitespace-nowrap', textStyles])}>
          {$streamManagerStage.screenshare}
        </h3>
      )}
    </div>
  );
};

StageProfilePill.defaultProps = {
  type: STAGE_PROFILE_TYPES.FULLSCREEN_VIDEO_FEED,
  profileColor: '',
  avatarSrc: '',
  isScreenshare: false
};
StageProfilePill.propTypes = {
  profileColor: PropTypes.string,
  avatarSrc: PropTypes.string,
  username: PropTypes.string.isRequired,
  isScreenshare: PropTypes.bool,
  type: PropTypes.string
};

export default StageProfilePill;
