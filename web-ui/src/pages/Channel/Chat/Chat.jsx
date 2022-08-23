import PropTypes from 'prop-types';
import { memo } from 'react';

import { clsm } from '../../../utils';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import useChat from './useChat';

const Chat = ({ chatRoomOwnerUsername, isChannelLoading }) => {
  const { isConnectionOpen, sendMessage } = useChat(chatRoomOwnerUsername);

  const handleSendMessage = () => {
    sendMessage('Hello World!');
  };

  return (
    <div
      className={clsm([
        'flex',
        'flex-1',
        'flex-col',
        'items-center',
        'justify-center',
        'gap-y-4'
      ])}
    >
      {isChannelLoading ? (
        <Spinner variant="light" size="medium" />
      ) : (
        <>
          <h2>Chat Section</h2>
          <Button onClick={handleSendMessage} isLoading={!isConnectionOpen}>
            Send Message
          </Button>
        </>
      )}
    </div>
  );
};

Chat.defaultProps = {
  chatRoomOwnerUsername: '',
  isChannelLoading: false
};

Chat.propTypes = {
  chatRoomOwnerUsername: PropTypes.string.isRequired,
  isChannelLoading: PropTypes.bool
};

export default memo(Chat);
