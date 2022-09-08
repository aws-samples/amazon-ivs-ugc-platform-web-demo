import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../../../utils';
import { CHAT_LINE_VARIANT } from '../utils';
import { useChatMessages } from '../../../../contexts/ChatMessages';
import { useMobileBreakpoint } from '../../../../contexts/MobileBreakpoint';
import ChatLine from './ChatLine/ChatLine';
import StickScrollButton from './StickScrollButton';
import useStickyScroll from '../../../../hooks/useStickyScroll';

const Messages = ({ chatRoomOwnerUsername, openChatPopup }) => {
  const chatRef = useRef();
  const bottomRef = useRef();
  const { messages, initMessages } = useChatMessages();
  const { isSticky, scrollToBottom } = useStickyScroll(
    chatRef,
    bottomRef,
    messages
  );
  const { isMobileView, isLandscape } = useMobileBreakpoint();
  const isSplitView = isMobileView && isLandscape;

  useEffect(() => {
    if (chatRoomOwnerUsername) {
      initMessages(chatRoomOwnerUsername);
    }
  }, [chatRoomOwnerUsername, initMessages]);

  useEffect(() => {
    // Reset the sticky scroll when entering/exiting split view
    // as the scroll position will change between layouts
    setTimeout(scrollToBottom, 10);
  }, [isSplitView, scrollToBottom]);

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
          'overflow-x-hidden',
          'overflow-y-auto',
          'supports-overlay:overflow-y-overlay'
        ])}
        role="log"
        ref={chatRef}
      >
        {messages.map(
          ({
            Content: message,
            Id: messageId,
            Sender: { Attributes: senderAttributes }
          }) => (
            <ChatLine
              key={messageId}
              message={message}
              {...senderAttributes}
              openChatPopup={openChatPopup}
              variant={CHAT_LINE_VARIANT.MESSAGE}
            />
          )
        )}
        <div ref={bottomRef} />
      </div>
      <StickScrollButton isSticky={isSticky} scrollToBottom={scrollToBottom} />
    </div>
  );
};

Messages.defaultProps = { chatRoomOwnerUsername: '' };

Messages.propTypes = {
  chatRoomOwnerUsername: PropTypes.string,
  openChatPopup: PropTypes.func.isRequired
};

export default Messages;
