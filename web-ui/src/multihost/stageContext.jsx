import React, {
  createContext,
  useCallback,
  useState,
  useContext,
  useMemo
} from 'react';
import { useChat } from '../contexts/Chat';
import PropTypes from 'prop-types';

// Define request statuses
export const REQUEST_STATUS = {
  REQUEST_JOIN: 'REQUEST_JOIN',
  REQUEST_APPROVED: 'REQUEST_APPROVED',
  REQUEST_REJECTED: 'REQUEST_REJECTED'
};
const StageRequestContext = createContext(null);

export const StageRequestProvider = ({ children }) => {
  const [joinRequestStatus, setJoinRequestStatus] = useState(null);
  const { requestJoin, requestAprrove, requestReject } = useChat();

  const sendJoinRequest = useCallback(() => {
    // setJoinRequestStatus(REQUEST_STATUS.REQUEST_JOIN);
    requestJoin();
    //  logic to notify the host about the join request
  }, []);

  const approveJoinRequest = useCallback(() => {
    // setJoinRequestStatus(REQUEST_STATUS.REQUEST_APPROVED);
    requestAprrove();
    //  logic for what happens when a request is REQUEST_approved
  }, []);

  const rejectJoinRequest = useCallback(() => {
    // setJoinRequestStatus(REQUEST_STATUS.REQUEST_REJECTED);
    requestReject();
    //  logic for what happens when a request is REQUEST_rejected
  }, []);

  const value = useMemo(
    () => ({
      joinRequestStatus,
      sendJoinRequest,
      approveJoinRequest,
      rejectJoinRequest,
      setJoinRequestStatus
    }),
    [joinRequestStatus, sendJoinRequest, approveJoinRequest, rejectJoinRequest,setJoinRequestStatus]
  );

  return (
    <StageRequestContext.Provider value={value}>
      {children}
    </StageRequestContext.Provider>
  );
};

StageRequestProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook for using the context
export const useStageRequest = () => {
  const context = useContext(StageRequestContext);
  if (context === undefined) {
    throw new Error('useStageRequest must be used within StageRequestProvider');
  }
  return context;
};

// // Usage in a component
// const MyComponent = () => {
//   const { sendJoinRequest, approveJoinRequest, rejectJoinRequest, joinRequestStatus } = useStageRequest();

//   // Example button to send join request
//   const handleJoinRequest = () => {
//     sendJoinRequest();
//   };

//   // Example logic to render based on the join request status
//   return (
//     <div>
//       {joinRequestStatus === REQUEST_STATUS.REQUEST_JOIN && <p>Join request sent, waiting for approval...</p>}
//       {joinRequestStatus === REQUEST_STATUS.REQUEST_APPROVED && <p>Join request REQUEST_approved!</p>}
//       {joinRequestStatus === REQUEST_STATUS.REQUEST_REJECTED && <p>Join request REQUEST_rejected.</p>}

//       <button onClick={handleJoinRequest}>Request to Join</button>
//     </div>
//   );
// };
