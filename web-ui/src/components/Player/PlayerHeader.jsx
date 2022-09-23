import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { PLAYER_OVERLAY_CLASSES } from './PlayerTheme';
import UserAvatar from '../UserAvatar';

const getAnimationProps = (shouldShowPlayerOverlay) => ({
  animate: shouldShowPlayerOverlay ? 'visible' : 'hidden',
  initial: 'hidden',
  exit: 'hidden',
  variants: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  transition: { duration: 0.25, type: 'tween' }
});

const PlayerHeader = ({ avatar, color, shouldShowPlayerOverlay, username }) => (
  <div className={clsm(['absolute', 'w-full', 'top-0'])}>
    <div
      className={clsm(
        'flex',
        'items-center',
        'pl-8',
        'pt-8',
        'lg:pl-4',
        'lg:pt-4'
      )}
    >
      <div className={clsm(['z-10', 'flex-shrink-0'])}>
        <UserAvatar avatarName={avatar} profileColor={color} />
      </div>
      {!!username && (
        <m.div
          className={clsm(
            'flex',
            'overflow-hidden',
            'text-white',
            'pl-4',
            'z-20'
          )}
          {...getAnimationProps(shouldShowPlayerOverlay)}
        >
          <h3
            className={clsm([
              'text-white',
              'overflow-hidden',
              'whitespace-nowrap',
              'overflow-ellipsis'
            ])}
          >
            {username}
          </h3>
        </m.div>
      )}
    </div>
    <m.div
      {...getAnimationProps(shouldShowPlayerOverlay)}
      className={clsm([
        PLAYER_OVERLAY_CLASSES,
        'player-header-container',
        'lg:pt-4',
        'lg:px-4',
        'pt-8',
        'px-8',
        'top-0'
      ])}
    ></m.div>
  </div>
);

PlayerHeader.defaultProps = {
  avatar: '',
  color: '',
  shouldShowPlayerOverlay: true,
  username: ''
};

PlayerHeader.propTypes = {
  avatar: PropTypes.string,
  color: PropTypes.string,
  shouldShowPlayerOverlay: PropTypes.bool,
  username: PropTypes.string
};

export default PlayerHeader;
