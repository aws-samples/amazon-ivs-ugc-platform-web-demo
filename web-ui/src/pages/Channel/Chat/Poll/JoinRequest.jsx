import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import { useChat } from '../../../../contexts/Chat';
import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import RequestJoinStage from './RequestJoinStage';
import ApproveRejectRequest from './ApproveRejectRequest';

const JoinRequest = ({ shouldRenderInTab }) => {
  const { pathname } = useLocation();
  const { isActive } = usePoll();
  const { isModerator, joinRequestStatus,isStageOwner } = useChat();
  const { isDesktopView, isLandscape } = useResponsiveDevice();
  const isStreamManagerPage = pathname === '/manager' || pathname === '/stage';

  return (
    <div>
      {isStreamManagerPage && isModerator && joinRequestStatus?.status === 'REQUEST_JOIN' && (
        <ApproveRejectRequest />
      )}
      {!isStreamManagerPage && <RequestJoinStage />}
    </div>
  );
};

JoinRequest.defaultProps = {
  shouldRenderInTab: false
};

JoinRequest.propTypes = {
  shouldRenderInTab: PropTypes.bool
};

export default JoinRequest;
