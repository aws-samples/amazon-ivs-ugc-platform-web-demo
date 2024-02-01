import React from 'react';
import Button from '../../../../components/Button';
import { useChat } from '../../../../contexts/Chat';
import { useUser } from '../../../../contexts/User';

const RequestJoinStage = () => {
  const { joinRequestStatus, requestJoin,requestWithdraw } = useChat();
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
        <Button onClick={requestJoin} className="fixed bottom-24 right-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Raise Hand
        </Button>
      ) : (
        currentUser && (
          <div className='flex flex-row fixed bottom-24 right-8 items-center justify-between'>
          <p className='  py-2 px-4' style={{ color: getStatusColor() }}>
            {getStatusMessage()}
          </p>
          <Button onClick={requestWithdraw} className=" bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Lower Hand
        </Button>
          </div>
        )
      )}
    </>
  );
};

export default RequestJoinStage;
