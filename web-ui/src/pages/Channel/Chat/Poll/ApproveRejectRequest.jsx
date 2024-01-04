import React, { useContext } from 'react';
import Button from '../../../../components/Button';
import { useChat } from '../../../../contexts/Chat';

const ApproveRejectRequest = () => {
  const { requestJoin, requestAprrove, requestReject } = useChat();

  return (
    <div className="flex flex-row justify-between w-full">
      <Button
        onClick={requestAprrove}
        className="dark:bg-darkMode-green
            bg-darkMode-green
            hover:dark:bg-darkMode-green-hover
            hover:bg-darkMode-green-hover
            focus:bg-darkMode-green text-white mr-10"
      >
        <span style={{ color: 'whitesmoke' }}>Approve</span>
      </Button>
      <Button
        onClick={requestReject}
        className="dark:bg-darkMode-red
            bg-darkMode-red
            hover:dark:bg-darkMode-red-hover
            hover:bg-darkMode-red-hover
            focus:bg-darkMode-red text-white"
      >
        <span style={{ color: 'whitesmoke' }}>Reject</span>
      </Button>
    </div>
  );
};

export default ApproveRejectRequest;
