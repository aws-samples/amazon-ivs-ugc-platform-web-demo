import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { channel as $channelContent } from '../../../../content';
import { clsm } from '../../../../utils';
import { getAvatarSrc } from '../../../../helpers';
import { useChannel } from '../../../../contexts/Channel';
import { useChatMessages } from '../../../../contexts/ChatMessages';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import ChatLine from './ChatLine';
import StickScrollButton from './StickScrollButton';
import useStickyScroll from '../../../../hooks/useStickyScroll';
import useResize from '../../../../hooks/useResize';

const $content = $channelContent.chat;

const Messages = ({ isChatPopupOpen, isModerator, openChatPopup }) => {
  const { channelData } = useChannel();
  const { username: chatRoomOwnerUsername } = channelData || {};
  const chatRef = useRef();
  const { messages, initMessages } = useChatMessages();
  const [hasInitMessages, setHasInitMessages] = useState(false);
  const { isSticky, scrollToBottom } = useStickyScroll(chatRef, messages);
  const { isMobileView, isLandscape } = useResponsiveDevice();
  const isSplitView = isMobileView && isLandscape;

  useEffect(() => {
    if (chatRoomOwnerUsername) {
      initMessages(chatRoomOwnerUsername);
      setHasInitMessages(true);
    }

    return () => setHasInitMessages(false);
  }, [chatRoomOwnerUsername, initMessages]);

  useEffect(() => {
    // Reset the sticky scroll when entering/exiting split view
    // as the scroll position will change between layouts
    setTimeout(scrollToBottom, 10);
  }, [isSplitView, scrollToBottom]);

  useResize(() => {
    // Reset the sticky scroll when resizing browser
    setTimeout(scrollToBottom, 10);
  });

  return (
    <div
      className={clsm([
        'flex',
        'h-full',
        'items-end',
        'justify-center',
        'relative',
        'w-full'
      ])}
    >
      <div
        className={clsm([
          'no-scrollbar',
          'absolute',
          'h-full',
          'w-full',
          'flex',
          'flex-col',
          'items-start',
          'space-y-3',
          'px-[18px]',
          'pt-5',
          'overflow-x-hidden',
          'overflow-y-auto',
          'supports-overlay:overflow-y-overlay'
        ])}
        role="log"
        ref={chatRef}
      >
        {(hasInitMessages ? messages : []).map(
          ({
            content: message,
            id: messageId,
            isDeleted,
            isOwnMessage,
            isPreloaded,
            sender: { attributes: senderAttributes },
            wasDeletedByUser
          }) => {
            const {
              channelAssetUrls: channelAssetUrlsStr,
              avatar: avatarName,
              ...restSenderAttributes
            } = senderAttributes;
            const avatarSrc = getAvatarSrc({
              avatar: avatarName,
              channelAssetUrls: channelAssetUrlsStr
                ? JSON.parse(channelAssetUrlsStr)
                : {}
            });

            const selectMessageToModerate = () =>
              openChatPopup({
                id: messageId,
                message,
                avatarSrc,
                ...restSenderAttributes
              });

            if (isDeleted && (isOwnMessage || wasDeletedByUser))
              return (
                <p
                  data-testid="chatline-message-removed"
                  className={clsm([
                    'dark:text-darkMode-gray-light',
                    'text-lightMode-gray-dark',
                    'font-bold',
                    'py-3'
                  ])}
                  key={messageId}
                >
                  {$content.message_removed}
                </p>
              );
            else if (isDeleted) return null;

            return (
              <ChatLine
                {...(isModerator ? { onClick: selectMessageToModerate } : {})}
                {...senderAttributes}
                avatarSrc={avatarSrc}
                isFocusable={isModerator && !isChatPopupOpen}
                key={messageId}
                message={message}
                shouldAnimateIn={!isPreloaded}
              />
            );
          }
        )}
      </div>
      <StickScrollButton isSticky={isSticky} scrollToBottom={scrollToBottom} />
    </div>
  );
};

Messages.defaultProps = { isChatPopupOpen: false, isModerator: false };

Messages.propTypes = {
  isChatPopupOpen: PropTypes.bool,
  isModerator: PropTypes.bool,
  openChatPopup: PropTypes.func.isRequired
};

export default Messages;
