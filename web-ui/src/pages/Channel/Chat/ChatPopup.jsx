import { motion } from 'framer-motion';
import { useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

import { channel as $channelContent } from '../../../content';
import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { HAIRLINE_DIVIDER_CLASSES } from '../../../components/ProfileMenu/ProfileMenuTheme';
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

const ChatPopup = ({
  banUser,
  deleteMessage,
  isOpen,
  selectedMessage: { avatarSrc, color, displayName, message, channelArn },
  setIsChatPopupOpen
}) => {
  const { isMobileView, isTouchscreenDevice } = useResponsiveDevice();
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

  const handleBanUser = () => {
    handleClose();

    openModal({
      content: {
        confirmText: $modalContent.confirm_ban_user,
        isDestructive: true,
        message: `${$modalContent.ban_user_message} ${displayName}?`
      },
      onConfirm: async () => {
        await banUser(channelArn);
        handleClose();
      },
      onCancel: showChatPopup
    });
  };

  const handleCancelAndRefocus = (event) => handleClose(event, true);

  useClickAway([popupRef], () => setIsChatPopupOpen(false));

  useEffect(() => {
    /**
     * When the chat popup is open and not currently visible on the screen, automatically scroll the chat popup into view.
     * Scroll treshhold value determines when the auto-scroll will trigger. We are  triggering the scroll when at least a quarter of the popup is visible.
     */
    if (!isOpen) return;

    const {
      top: popupTop,
      bottom: popupBottom,
      height: popupHeight
    } = popupRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const scrollTreshhold = popupTop + popupHeight / 4;
    const isPopupInView = scrollTreshhold < windowHeight && popupBottom >= 0;

    if (!isPopupInView) popupRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen]);

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
      data-testid="chat-popup-container"
    >
      <motion.div
        {...createAnimationProps({ animations: ['fadeIn-full'] })}
        className={clsm([
          'absolute',
          'bg-modalOverlay',
          'h-full',
          'left-0',
          'top-0',
          'w-full'
        ])}
      />
      <motion.div
        {...createAnimationProps({
          animations: ['fadeIn-half'],
          customVariants: {
            hidden: { y: '75%' },
            visible: { y: 0 }
          }
        })}
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
          avatarSrc={avatarSrc}
          color={color}
          displayName={displayName}
          message={message}
          shouldAnimateIn={false}
          shouldAnimateOut={false}
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
              'dark:text-darkMode-red',
              'focus:bg-white',
              'focus:shadow-lightMode-red',
              !isTouchscreenDevice && [
                'hover:bg-lightMode-gray-light-hover',
                'dark:hover:bg-white-hover'
              ],
              'text-lightMode-red'
            ])}
            variant="tertiary"
            onClick={() => {
              deleteMessage();
              handleClose();
            }}
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
                'focus:bg-lightMode-red',
                'focus:shadow-black',
                !isTouchscreenDevice && [
                  'hover:bg-lightMode-red-hover',
                  'dark:hover:bg-darkMode-red-hover'
                ],
                'dark:text-black',
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
              !isTouchscreenDevice && ['hover:bg-lightMode-gray-hover']
            ])}
            variant="secondary"
            onClick={handleCancelAndRefocus}
          >
            {$content.cancel}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

ChatPopup.defaultProps = { isOpen: false };

ChatPopup.propTypes = {
  banUser: PropTypes.func.isRequired,
  deleteMessage: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  selectedMessage: PropTypes.shape({
    avatar: PropTypes.string,
    avatarSrc: PropTypes.string,
    channelArn: PropTypes.string,
    color: PropTypes.string,
    displayName: PropTypes.string,
    id: PropTypes.string,
    message: PropTypes.string
  }).isRequired,
  setIsChatPopupOpen: PropTypes.func.isRequired
};

export default withPortal(ChatPopup, 'chat-popup', { isAnimated: true });
