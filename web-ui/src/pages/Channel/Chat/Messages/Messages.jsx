import PropTypes from 'prop-types';
import { useEffect } from 'react';

import { useChatMessages } from '../../../../contexts/ChatMessages';
import { clsm } from '../../../../utils';
import ChatLine from './ChatLine';

const Messages = ({ chatRoomOwnerUsername }) => {
  const { messages, initMessages } = useChatMessages();

  useEffect(() => {
    if (chatRoomOwnerUsername) {
      initMessages(chatRoomOwnerUsername);
    }
  }, [chatRoomOwnerUsername, initMessages]);

  return (
    <div className={clsm(['relative', 'w-full', 'h-full'])}>
      <div
        className={clsm([
          'absolute',
          'h-full',
          'w-full',
          'flex',
          'flex-col',
          'items-start',
          'gap-y-3',
          'px-[18px]',
          'pt-5',
          'overflow-auto',
          'scroll-smooth',
          'supports-overlay:overflow-overlay'
        ])}
      >
        {messages.map(
          ({
            Content: message,
            Id: messageId,
            Sender: { Attributes: senderAttributes }
          }) => (
            <ChatLine key={messageId} message={message} {...senderAttributes} />
          )
        )}
      </div>
    </div>
  );
};

Messages.defaultProps = { chatRoomOwnerUsername: '' };

Messages.propTypes = { chatRoomOwnerUsername: PropTypes.string };

export default Messages;
