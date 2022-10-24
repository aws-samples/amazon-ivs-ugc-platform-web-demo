import { m } from 'framer-motion';
import { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

import { channel as $channelContent } from '../../../content';
import { clsm } from '../../../utils';
import { HAIRLINE_DIVIDER_CLASSES } from '../../../components/ProfileMenu/ProfileMenuTheme';
import { useChatMessages } from '../../../contexts/ChatMessages';
import { useModal } from '../../../contexts/Modal';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
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
  isStackedView,
  openChatPopup,
  selectedMessage: { avatar, color, displayName, message, id },
  setIsChatPopupOpen
}) => {
  const { isMobileView } = useResponsiveDevice();
  const { userData } = useUser();
  const { username } = userData || {};
  const { openModal } = useModal();
  const { deletedMessageIds } = useChatMessages();
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

  const handleDeleteMessage = useCallback(() => {
    deleteMessage(id);
    deletedMessageIds.current.push(id);
    handleClose();
  }, [deleteMessage, deletedMessageIds, handleClose, id]);

  const handleBanUser = () => {
    handleClose();

    openModal({
      content: {
        confirmText: $modalContent.confirm_ban_user,
        isDestructive: true,
        message: `${$modalContent.ban_user_message} ${displayName}?`
      },
      onConfirm: async () => {
        await banUser(displayName);
        handleClose();
      },
      onCancel: showChatPopup
    });
  };

  const handleCancelAndRefocus = (event) => handleClose(event, true);

  useClickAway([popupRef], () => setIsChatPopupOpen(false));

  return (
    <div
      className={clsm([
        'absolute',
        'flex-col',
        'flex',
        'h-full',
        'justify-end',
        'left-0',
        'md:p-4',
        'px-5',
        'py-6',
        'top-0',
        'w-full',
        'z-[200]',
        isMobileView && ['fixed', 'w-screen']
      ])}
    >
      <m.div
        {...defaultAnimationProps}
        variants={{ visible: { opacity: 1 }, hidden: { opacity: 0 } }}
        className={clsm([
          'absolute',
          'bg-modalOverlay',
          'h-full',
          'left-0',
          'top-0',
          'w-full'
        ])}
      ></m.div>
      <m.div
        {...defaultAnimationProps}
        variants={{ visible: { y: 0 }, hidden: { y: '150%' } }}
        className={clsm([
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray-medium',
          'flex-col',
          'flex',
          'items-start',
          'lg:max-h-[calc(calc(var(--mobile-vh,1vh)_*_100)_-_48px)]',
          'md:max-h-[calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px)]',
          'relative',
          'rounded-3xl',
          'w-full'
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
        <div className={clsm(['flex', 'p-4', 'pt-[14px]', 'w-full'])}>
          <span
            className={clsm(
              HAIRLINE_DIVIDER_CLASSES,
              'bg-lightMode-gray',
              'dark:bg-darkMode-gray-medium-hover'
            )}
          />
        </div>
        <div
          className={clsm([
            'flex-col',
            'flex',
            'space-y-4',
            'pb-4',
            'px-4',
            'w-full'
          ])}
        >
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
              'dark:focus:shadow-white',
              'focus:bg-lightMode-gray',
              'focus:shadow-black',
              'hover:bg-lightMode-gray-hover'
            ])}
            variant="secondary"
            onClick={handleCancelAndRefocus}
          >
            {$content.cancel}
          </Button>
        </div>
      </m.div>
    </div>
  );
};

ChatPopup.defaultProps = {
  isOpen: false,
  isStackedView: false
};

ChatPopup.propTypes = {
  banUser: PropTypes.func.isRequired,
  deleteMessage: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  isStackedView: PropTypes.bool,
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
