import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { PLAYER_OVERLAY_CLASSES } from './PlayerTheme';
import UserAvatar from '../UserAvatar';

const getAnimationProps = (shouldShowPlayerOverlay) => {
  return {
    animate: shouldShowPlayerOverlay ? 'visible' : 'hidden',
    initial: 'hidden',
    exit: 'hidden',
    variants: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    transition: { duration: 0.25, type: 'tween' }
  };
};

const PlayerHeader = ({ username, shouldShowPlayerOverlay, color, avatar }) => (
  <>
    <div
      className={clsm(
        'flex',
        'items-center',
        'absolute',
        'pl-8',
        'pt-8',
        'lg:pl-4',
        'lg:pt-4'
      )}
    >
      <div className={clsm(['z-10', 'flex-shrink-0'])}>
        <UserAvatar avatarName={avatar} profileColor={color} />
      </div>
      <m.div
        className={clsm('flex', 'text-white', 'pl-4', 'z-20')}
        {...getAnimationProps(shouldShowPlayerOverlay)}
      >
        <h3
          className={clsm([
            'text-white',
            'overflow-hidden',
            'whitespace-nowrap',
            'overflow-ellipsis',
            'max-w-[200px]'
          ])}
        >
          {username}
        </h3>
      </m.div>
    </div>
    <m.div
      {...getAnimationProps(shouldShowPlayerOverlay)}
      className={clsm([
        PLAYER_OVERLAY_CLASSES,
        'player-header-container',
        'lg:px-4',
        'lg:pt-4',
        'px-8',
        'pt-8'
      ])}
    ></m.div>
  </>
);

PlayerHeader.defaultProps = {
  shouldShowPlayerOverlay: true
};

PlayerHeader.propTypes = {
  username: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired,
  shouldShowPlayerOverlay: PropTypes.bool
};

export default PlayerHeader;
