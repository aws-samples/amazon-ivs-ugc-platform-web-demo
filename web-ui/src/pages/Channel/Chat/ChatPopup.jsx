import { m } from 'framer-motion';
import { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

import { channel as $channelContent } from '../../../content';
import { clsm } from '../../../utils';
import { HAIRLINE_DIVIDER_CLASSES } from '../../../components/ProfileMenu/ProfileMenuTheme';
import { useChatMessages } from '../../../contexts/ChatMessages';
import { useModal } from '../../../contexts/Modal';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import ChatLine, { CHAT_LINE_VARIANT } from './Messages/ChatLine';
import useClickAway from '../../../hooks/useClickAway';
import usePreviousFocus from '../../../hooks/usePreviousFocus';
import withPortal from '../../../components/withPortal';

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
  selectedMessage: { avatar, color, displayName, message, id },
  setIsChatPopupOpen,
  openChatPopup,
  isSplitView
}) => {
  const { userData } = useUser();
  const { username } = userData || {};
  const { openModal } = useModal();
  const { deletedMessageIds } = useChatMessages();
  const popupRef = useRef();
  const isOwnMessage = username === displayName;
  const popupContainerVariant = isSplitView ? 'md:top-4' : '';
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

  const handleDeleteMessage = useCallback(() => {
    deleteMessage(id);
    deletedMessageIds.current.push(id);
    handleClose();
  }, [deleteMessage, deletedMessageIds, handleClose, id]);

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
    <>
      <m.div
        {...defaultAnimationProps}
        variants={{ visible: { y: 0 }, hidden: { y: '150%' } }}
        className={clsm([
          popupContainerVariant,
          'absolute',
          'bottom-6',
          'left-5',
          'right-5',
          'md:bottom-4',
          'md:left-4',
          'md:right-4',
          'w-auto',
          'p-4',
          'rounded-3xl',
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray-medium',
          'z-[999]',
          'flex',
          'items-start',
          'flex-col'
        ])}
        ref={popupRef}
      >
        <ChatLine
          message={message}
          avatar={avatar}
          color={color}
          displayName={displayName}
          variant={CHAT_LINE_VARIANT.POPUP}
        />
        <span
          className={clsm(
            HAIRLINE_DIVIDER_CLASSES,
            'mt-4',
            'mb-4',
            'dark:bg-darkMode-gray-medium-hover',
            'bg-lightMode-gray'
          )}
        />
        <div className={clsm(['flex', 'flex-col', 'gap-y-4', 'w-full'])}>
          <Button
            className={clsm([
              'bg-white',
              'dark:bg-white',
              'dark:focus:bg-white',
              'dark:focus:shadow-darkMode-red',
              'dark:hover:bg-white-hover',
              'dark:text-darkMode-red',
              'focus:bg-white',
              'focus:shadow-lightMode-red',
              'hover:bg-lightMode-gray-light-hover',
              'text-lightMode-red'
            ])}
            variant="tertiary"
            onClick={handleDeleteMessage}
          >
            {$content.delete_message}
          </Button>
          {!isOwnMessage && (
            <Button
              className={clsm(
                'bg-lightMode-red',
                'dark:bg-darkMode-red',
                'dark:focus:bg-darkMode-red',
                'dark:focus:shadow-white',
                'dark:hover:bg-darkMode-red-hover',
                'dark:text-white',
                'focus:bg-lightMode-red',
                'focus:shadow-black',
                'hover:bg-lightMode-red-hover',
                'text-white'
              )}
              variant="destructive"
              onClick={handleBanUser}
            >
              {$content.ban_user}
            </Button>
          )}
          <Button
            className={clsm([
              'bg-lightMode-gray',
              'hover:bg-lightMode-gray-hover',
              'focus:bg-lightMode-gray',
              'focus:shadow-black',
              'dark:focus:shadow-white'
            ])}
            variant="secondary"
            onClick={handleClose}
          >
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
  );
};

ChatPopup.defaultProps = { isOpen: false, isSplitView: false };

ChatPopup.propTypes = {
  banUser: PropTypes.func.isRequired,
  deleteMessage: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  isSplitView: PropTypes.bool,
  openChatPopup: PropTypes.func.isRequired,
  selectedMessage: PropTypes.shape({
    avatar: PropTypes.string,
    color: PropTypes.string,
    displayName: PropTypes.string,
    id: PropTypes.string,
    message: PropTypes.string
  }).isRequired,
  setIsChatPopupOpen: PropTypes.func.isRequired
};

export default withPortal(ChatPopup, 'chat-popup', { isAnimated: true });
