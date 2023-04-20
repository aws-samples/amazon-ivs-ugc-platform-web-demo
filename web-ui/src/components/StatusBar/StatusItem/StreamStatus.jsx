import { useCallback } from 'react';
import PropTypes from 'prop-types';

import { app as $appContent } from '../../../content';
import { clsm } from '../../../utils';
import { Sensors } from '../../../assets/icons';
import { useUser } from '../../../contexts/User';
import Button from '../../Button';
import StatusItemTooltip from './StatusItemTooltip';

const $content = $appContent.status_bar;

const StreamStatus = ({ isLive }) => {
  const { userData } = useUser();

  const handleViewChannelClick = useCallback(() => {
    window.open(`/${userData?.username}`, '_blank');
  }, [userData?.username]);

  return (
    <StatusItemTooltip text={$content.view_your_channel}>
      <Button
        ariaLabel={$content.view_your_channel}
        className={clsm([
          'bg-lightMode-gray',
          'focus:bg-lightMode-gray',
          'h-auto',
          'hover:bg-lightMode-gray-hover',
          'min-w-0',
          'p-1.5',
          'text-black',
          'w-8',
          'h-8'
        ])}
        variant="secondary"
        onClick={handleViewChannelClick}
      >
        <Sensors isLive={isLive} />
      </Button>
    </StatusItemTooltip>
  );
};

StreamStatus.defaultProps = {
  isLive: false
};

StreamStatus.propTypes = {
  isLive: PropTypes.bool
};

export default StreamStatus;
