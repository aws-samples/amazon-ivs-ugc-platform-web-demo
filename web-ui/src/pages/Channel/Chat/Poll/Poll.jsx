import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import StreamerPoll from './StreamerPoll';
import ViewerPoll from './ViewerPoll';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useChat } from '../../../../contexts/Chat';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';

const Poll = ({ shouldRenderInTab }) => {
  const { pathname } = useLocation();
  const { isActive } = usePoll();
  const { isModerator } = useChat();
  const { isDesktopView, isLandscape } = useResponsiveDevice();
  const isStreamManagerPage = pathname === '/manager';

  return (
    <div
      className={clsm([
        !isStreamManagerPage && [
          'no-scrollbar',
          'overflow-y-auto',
          'supports-overlay:overflow-y-overlay',
          !isDesktopView && ['pb-20', 'h-full']
        ],
        'w-full',
        'absolute',
        isLandscape && 'mb-[110px]',
        !isActive ? 'z-0' : 'z-50'
      ])}
    >
      {isModerator && isStreamManagerPage && <StreamerPoll />}
      {!isStreamManagerPage && (
        <ViewerPoll shouldRenderInTab={shouldRenderInTab} />
      )}
    </div>
  );
};

Poll.defaultProps = {
  shouldRenderInTab: false
};

Poll.propTypes = {
  shouldRenderInTab: PropTypes.bool
};

export default Poll;
