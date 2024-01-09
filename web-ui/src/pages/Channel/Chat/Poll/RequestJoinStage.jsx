import React, { useContext } from 'react';
import Button from '../../../../components/Button';
import { useChat } from '../../../../contexts/Chat';

const RequestJoinStage = () => {
  const { joinRequestStatus, requestJoin } = useChat();

  return (
    <>
      {!joinRequestStatus ? (
        <Button onClick={requestJoin} className="request-join-stage-button">
          Raise Hand
        </Button>
      ) : (
        <p
          style={{
            color:
              joinRequestStatus === 'REQUEST_JOIN'
                ? 'orange'
                : joinRequestStatus === 'REQUEST_APPROVED'
                ? 'green'
                : 'red'
          }}
        >
          {joinRequestStatus === 'REQUEST_JOIN'
                ? 'Request Pending'
                : joinRequestStatus === 'REQUEST_APPROVED'
                ? 'Request Approved'
                : 'Request Rejected'}
        </p>
      )}
    </>
  );
};

export default RequestJoinStage;
