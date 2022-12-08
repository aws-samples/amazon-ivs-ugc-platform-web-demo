import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import PlayerOverlay from './PlayerOverlay';
import UserAvatar from '../UserAvatar';

const PlayerHeader = ({
  avatarSrc,
  color,
  shouldShowPlayerOverlay,
  username
}) => (
  <div
    className={clsm(
      'absolute',
      'w-full',
      'top-0',
      'flex',
      'items-center',
      'pl-8',
      'pt-8',
      'lg:pl-4',
      'lg:pt-4',
      'pointer-events-none'
    )}
  >
    <PlayerOverlay position="top" isVisible={shouldShowPlayerOverlay}>
      {!!username && (
        <div
          className={clsm(
            'flex',
            'h-11',
            'items-center',
            'overflow-hidden',
            'pl-16'
          )}
        >
          <h3 className={clsm(['truncate', 'text-white'])}>{username}</h3>
        </div>
      )}
    </PlayerOverlay>
    <div className={clsm(['relative', 'flex-shrink-0'])}>
      <UserAvatar avatarSrc={avatarSrc} profileColor={color} />
    </div>
  </div>
);

PlayerHeader.defaultProps = {
  avatarSrc: '',
  color: 'default',
  shouldShowPlayerOverlay: true,
  username: ''
};

PlayerHeader.propTypes = {
  avatarSrc: PropTypes.string,
  color: PropTypes.string,
  shouldShowPlayerOverlay: PropTypes.bool,
  username: PropTypes.string
};

export default PlayerHeader;
