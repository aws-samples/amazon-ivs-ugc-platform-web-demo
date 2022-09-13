import PropTypes from 'prop-types';
import { useCallback, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import { channel as $channelContent } from '../../../content';
import { clsm } from '../../../utils';
import { HAIRLINE_DIVIDER_CLASSES } from '../../../components/ProfileMenu/ProfileMenuTheme';
import { useModal } from '../../../contexts/Modal';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import ChatLine, { CHAT_LINE_VARIANT } from './Messages/ChatLine';
import useClickAway from '../../../hooks/useClickAway';
import usePreviousFocus from '../../../hooks/usePreviousFocus';

const $content = $channelContent.chat.popup;
const $modalContent = $channelContent.chat.modal.ban_user_modal;
const defaultTransition = { duration: 0.5, type: 'tween' };
const defaultAnimationProps = {
  animate: 'visible',
  exit: 'hidden',
  initial: 'hidden',
  transition: defaultTransition
};

const ChatPopup = ({
  banUser,
  deleteMessage,
  isOpen,
  selectedMessage: { avatar, color, displayName, message },
  setIsChatPopupOpen
}) => {
  const { userData } = useUser();
  const { username } = userData || {};
  const { openModal } = useModal();
  const popupRef = useRef();
  const isOwnMessage = username === displayName;
  const showChatPopup = useCallback(
    () => setIsChatPopupOpen(true),
    [setIsChatPopupOpen]
  );
  const hideChatPopup = useCallback(
    () => setIsChatPopupOpen(false),
    [setIsChatPopupOpen]
  );
  const { refocus: handleClose } = usePreviousFocus({
    isActive: isOpen,
    onRefocus: hideChatPopup
  });

  const handleDeleteMessage = () => {
    console.log('Message Deleted', { message });
    handleClose();
  };

  const handleBanUser = () => {
    handleClose();

    openModal({
      isDestructive: true,
      message: `${$modalContent.ban_user_message} ${displayName}?`,
      confirmText: $modalContent.confirm_ban_user,
      onConfirm: async () => {
        await banUser(displayName);
        handleClose();
      },
      onCancel: showChatPopup
    });
  };

  useClickAway([popupRef], () => setIsChatPopupOpen(false));

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { y: 0 }, hidden: { y: '150%' } }}
            className={clsm([
              'absolute',
              'bottom-6',
              'left-5',
              'right-5',
              'md:bottom-4',
              'md:left-4',
              'md:right-4',
              'w-auto',
              'h-auto',
              'p-4',
              'rounded-3xl',
              'bg-lightMode-gray-extraLight',
              'dark:bg-darkMode-gray-medium',
              'z-[999]',
              'flex',
              'justify-center',
              'items-center',
              'flex-col'
            ])}
            ref={popupRef}
          >
            <ChatLine
              avatar={avatar}
              color={color}
              displayName={displayName}
              message={message}
              variant={CHAT_LINE_VARIANT.POPUP}
            />
            <span className={clsm(HAIRLINE_DIVIDER_CLASSES, 'm-4')} />
            <div className={clsm(['flex', 'flex-col', 'gap-y-4', 'w-full'])}>
              <Button
                className={clsm('text-lightMode-red-hover')}
                variant="tertiary"
                onClick={handleDeleteMessage}
              >
                {$content.delete_message}
              </Button>
              {!isOwnMessage && (
                <Button
                  className={clsm('text-white', 'dark:text-white')}
                  variant="destructive"
                  onClick={handleBanUser}
                >
                  {$content.ban_user}
                </Button>
              )}
              <Button variant="secondary" onClick={handleClose}>
                {$content.cancel}
              </Button>
            </div>
          </m.div>
          <m.div
            {...defaultAnimationProps}
            variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
            className={clsm([
              'absolute',
              'top-0',
              'left-0',
              'w-full',
              'h-full',
              'bg-modalOverlay',
              'z-40'
            ])}
          ></m.div>
        </>
      )}
    </AnimatePresence>
  );
};

ChatPopup.defaultProps = { isOpen: false };

ChatPopup.propTypes = {
  banUser: PropTypes.func.isRequired,
  deleteMessage: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  selectedMessage: PropTypes.shape({
    avatar: PropTypes.string,
    color: PropTypes.string,
    displayName: PropTypes.string,
    message: PropTypes.string
  }).isRequired,
  setIsChatPopupOpen: PropTypes.func.isRequired
};

export default ChatPopup;
