import React, { useContext } from 'react';
import Button from '../../../../components/Button';
import { useChat } from '../../../../contexts/Chat';
import { Check, Close } from '../../../../assets/icons';

const ApproveRejectRequest = ({joinRequestStatus}) => {
  const { requestJoin, requestAprrove, requestReject } = useChat();

  return (
    <div className="flex flex-row w-full  left-1 top-3/4 absolute">
      <div>
        {`${joinRequestStatus?.requestedUsername} raised hand to speak`}
      </div>
      <Button
        onClick={requestAprrove}
        className="dark:bg-darkMode-green
            bg-darkMode-green
            hover:dark:bg-darkMode-green-hover
            hover:bg-darkMode-green-hover
            focus:bg-darkMode-green text-white mr-1 min-w-[46px] h-[40px]"
      >
        <Check style = {{ height: '34px', width: '34px'}}/>
      </Button>
      <Button
        onClick={requestReject}
        className="dark:bg-darkMode-red
            bg-darkMode-red
            hover:dark:bg-darkMode-red-hover
            hover:bg-darkMode-red-hover
            focus:bg-darkMode-red text-white min-w-[46px] h-[40px]"
      >
        <Close style = {{ height: '34px', width: '34px'}}/>
      </Button>
    </div>
  );
};

export default ApproveRejectRequest;
