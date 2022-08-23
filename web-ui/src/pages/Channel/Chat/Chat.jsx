import PropTypes from 'prop-types';
import { memo } from 'react';

import { CHAT_USER_ROLE } from './utils';
import { clsm } from '../../../utils';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import useChat from './useChat';

const Chat = ({ chatRoomOwnerUsername, isChannelLoading }) => {
  const { sendMessage, chatUserRole } = useChat(chatRoomOwnerUsername);
  const canSendMessages = chatUserRole === CHAT_USER_ROLE.SENDER;

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
      <h2>Chat Section</h2>
      {isChannelLoading ? (
        <Spinner variant="light" size="medium" />
      ) : (
        canSendMessages && (
          <Button onClick={handleSendMessage}>Send Message</Button>
        )
      )}
    </div>
  );
};

Chat.defaultProps = {
  chatRoomOwnerUsername: '',
  isChannelLoading: false
};

Chat.propTypes = {
  chatRoomOwnerUsername: PropTypes.string,
  isChannelLoading: PropTypes.bool
};

export default memo(Chat);
