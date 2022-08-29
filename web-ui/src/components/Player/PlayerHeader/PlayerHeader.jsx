import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { PLAYER_OVERLAY_CLASSES } from '../PlayerTheme';

import PlayerHeaderAvatar from './PlayerHeaderAvatar';

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

const PlayerHeader = ({ username, shouldShowPlayerOverlay, color, avatar }) => {
  return (
    <>
      <div className={clsm('flex', 'items-center', 'px-9', 'py-9', 'absolute')}>
        <PlayerHeaderAvatar color={color} avatar={avatar} />
        <m.div
          className={clsm('flex', 'text-white', 'pl-4', 'z-20')}
          {...getAnimationProps(shouldShowPlayerOverlay)}
        >
          <h3 className={clsm(['text-white'])}>{username}</h3>
        </m.div>
      </div>
      <m.div
        {...getAnimationProps(shouldShowPlayerOverlay)}
        className={clsm([
          PLAYER_OVERLAY_CLASSES,
          'player-header-container',
          'md:pb-[24px]',
          'md:portrait:pb-[50px]',
          'px-8',
          'pb-8',
          'top-0'
        ])}
      ></m.div>
    </>
  );
};

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
