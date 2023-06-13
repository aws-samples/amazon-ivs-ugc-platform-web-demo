import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { useChannel } from '../../../../contexts/Channel';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import { useUser } from '../../../../contexts/User';

const PollContainer = ({ children }) => {
  const marginBotttomRef = useRef();
  const { channelData } = useChannel();
  const { showFinalResults } = usePoll();
  const { isTouchscreenDevice, isLandscape } = useResponsiveDevice();
  const { isSessionValid } = useUser();
  const { color } = channelData || {};

  useEffect(() => {
    marginBotttomRef.current =
      isLandscape || !isSessionValid ? 'mb-28' : 'mb-0';
  }, [isTouchscreenDevice, isLandscape, isSessionValid]);

  return (
    <div
      className={clsm([
        'm-5',
        'p-5',
        showFinalResults && 'pb-7',
        `bg-profile-${color}`,
        'rounded-xl',
        `${marginBotttomRef.current}`
      ])}
    >
      {children}
    </div>
  );
};

PollContainer.propTypes = {
  children: PropTypes.node.isRequired
};

export default PollContainer;
