import PropTypes from 'prop-types';
import { useState, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import { channel as $channelContent } from '../../../content';
import { CHAT_LINE_VARIANT } from './utils';
import { clsm, noop } from '../../../utils';
import { HAIRLINE_DIVIDER_CLASSES } from '../../../components/ProfileMenu/ProfileMenuTheme';
import { useModal } from '../../../contexts/Modal';
import Button from '../../../components/Button';
import ChatLine from './Messages/ChatLine/ChatLine';
import useClickAway from '../../../hooks/useClickAway';
import useFocusTrap from '../../../hooks/useFocusTrap';

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
  isOpen,
  setIsChatPopupOpen,
  selectedMessage,
  openChatPopup
}) => {
  const { color, message, avatar, displayName } = selectedMessage;
  const [isBanningUserLoading, setIsBanningUserLoading] = useState(false);
  const { openModal } = useModal();
  const popupRef = useRef();

  // ban user handler will be completed in a subsequent PR
  const handleBanUser = () => {
    if (isBanningUserLoading) return;
    setIsChatPopupOpen(false);
    const banUser = () => {
      setIsBanningUserLoading(true);

      console.log('banned the user');
    };

    const banMessage = `${$modalContent.ban_user_message} ${displayName}?`;

    openModal({
      isDestructive: true,
      message: banMessage,
      confirmText: $modalContent.confirm_ban_user,
      onConfirm: banUser,
      onCancel: () => setIsChatPopupOpen(true)
    });
  };

  useFocusTrap([popupRef], !!isOpen);
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
              message={message}
              avatar={avatar}
              color={color}
              displayName={displayName}
              openChatPopup={openChatPopup}
              variant={CHAT_LINE_VARIANT.POPUP}
            />

            <span className={clsm(HAIRLINE_DIVIDER_CLASSES, 'm-4')} />
            <div className={clsm(['flex', 'flex-col', 'gap-y-4', 'w-full'])}>
              {/* the functionality will be done in a subsequent PR */}
              <Button
                className={clsm('text-lightMode-red-hover')}
                variant="tertiary"
              >
                {$content.delete_message}
              </Button>
              <Button
                className={clsm('text-white', 'dark:text-white')}
                variant="destructive"
                onClick={handleBanUser}
              >
                {$content.ban_user}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsChatPopupOpen(false);
                }}
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
      )}
    </AnimatePresence>
  );
};

ChatPopup.defaultProps = {
  isOpen: false,
  setIsChatPopupOpen: noop,
  openChatPopup: noop
};

ChatPopup.propTypes = {
  isOpen: PropTypes.bool,
  setIsChatPopupOpen: PropTypes.func,
  openChatPopup: PropTypes.func,
  selectedMessage: PropTypes.object.isRequired
};

export default ChatPopup;
