import React from 'react';
import Button from '../../../../components/Button';
import { useChat } from '../../../../contexts/Chat';
import { useUser } from '../../../../contexts/User';

const RequestJoinStage = () => {
  const { joinRequestStatus, requestJoin } = useChat();
  const { userData } = useUser();

  const currentUser = userData && joinRequestStatus && userData.id === joinRequestStatus.userId;
  const jStatus = joinRequestStatus ? joinRequestStatus.status : null;

  const getStatusMessage = () => {
    switch (jStatus) {
      case 'REQUEST_JOIN':
        return 'Request Pending';
      case 'REQUEST_APPROVED':
        return 'Request Approved';
      case 'REQUEST_REJECTED':
        return 'Request Rejected';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (jStatus) {
      case 'REQUEST_JOIN':
        return 'orange';
      case 'REQUEST_APPROVED':
        return 'green';
      case 'REQUEST_REJECTED':
        return 'red';
      default:
        return '';
    }
  };

  return (
    <>
      {!joinRequestStatus ? (
        <Button onClick={requestJoin} className="request-join-stage-button">
          Raise Hand
        </Button>
      ) : (
        currentUser && (
          <p style={{ color: getStatusColor() }}>
            {getStatusMessage()}
          </p>
        )
      )}
    </>
  );
};

export default RequestJoinStage;
