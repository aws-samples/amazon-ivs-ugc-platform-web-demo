import { motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';
import PropTypes from 'prop-types';

import { channel as $channelContent } from '../../../content';
import { channelAPI } from '../../../api';
import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import {
  Link as LinkIcon,
  Menu as MenuIcon,
  PersonAdd as PersonAddIcon,
  PersonOff as PersonOffIcon
} from '../../../assets/icons';
import { useChannel } from '../../../contexts/Channel';
import { useModal } from '../../../contexts/Modal';
import { useNotif } from '../../../contexts/Notification';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useUser } from '../../../contexts/User';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import useClickAway from '../../../hooks/useClickAway';

const $content = $channelContent.profileViewMenu;
const $modalContent = $channelContent.chat.modal;
const BUTTON_TEXT_CLASSES = ['text-black', 'dark:text-white'];

const IconClasses = clsm([
  'dark:fill-white',
  'fill-white-player',
  'h-6',
  'w-6'
]);

const ProfileViewMenu = ({ channelUsername }) => {
  const menuRef = useRef();
  const toggleBtnRef = useRef();
  const moderateUserButton = useRef();
  const { userData } = useUser();
  const { notifySuccess, notifyError } = useNotif();
  const { openModal } = useModal();
  const { isMobileView } = useResponsiveDevice();
  const { channelData: { isChannelBanned } = {}, refreshChannelData } =
    useChannel();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModerationActionLoading, setIsModerationActionLoading] =
    useState(false);
  const isOwnChannel = channelUsername === userData?.username;

  const toggleMenu = useCallback((value) => {
    setIsMenuOpen((prev) => (value !== undefined ? value : !prev));
  }, []);

  useClickAway([toggleBtnRef, menuRef], () => toggleMenu(false), isMenuOpen);

  const moderationHandler = () => {
    toggleMenu(false);

    let confirmText, modalMessage, successMessage, errorMessage;

    if (isChannelBanned) {
      confirmText = $modalContent.unban_user_modal.confirm_unban_user;
      modalMessage = `${$modalContent.unban_user_modal.unban_user_message} ${channelUsername}?`;
      successMessage = $channelContent.notifications.success.user_unbanned;
      errorMessage = $channelContent.notifications.error.unban_user;
    } else {
      confirmText = $modalContent.ban_user_modal.confirm_ban_user;
      modalMessage = `${$modalContent.ban_user_modal.ban_user_message} ${channelUsername}?`;
      successMessage = $channelContent.notifications.success.user_banned;
      errorMessage = $channelContent.notifications.error.ban_user;
    }

    const onConfirm = () => {
      (async function () {
        setIsModerationActionLoading(true);

        const handler = isChannelBanned
          ? channelAPI.unbanUser
          : channelAPI.banUser;
        const { result, error } = await handler(channelUsername);

        if (result) {
          await refreshChannelData();
          notifySuccess(successMessage);
        }
        if (error) notifyError(errorMessage);

        setIsModerationActionLoading(false);
      })();
    };

    openModal({
      content: {
        confirmText,
        isDestructive: true,
        message: modalMessage
      },
      onConfirm,
      onCancel: () => toggleMenu(true),
      lastFocusedElement: moderateUserButton
    });
  };

  const copyChannelLinkHandler = () => {
    copyToClipboard(window.location.href);
    notifySuccess($content.notifications.success.channel_link_copied);
    toggleMenu(false);
  };

  return (
    <>
      {isModerationActionLoading ? (
        <Spinner className="m-2.5" variant="light" />
      ) : (
        <Button
          className={clsm(['h-11', 'w-11'])}
          onClick={() => toggleMenu()}
          ref={toggleBtnRef}
          variant="icon"
          isDisabled={isModerationActionLoading}
        >
          <MenuIcon className={IconClasses} />
        </Button>
      )}
      <motion.div
        ref={menuRef}
        {...createAnimationProps({
          animations: ['fadeIn-full', 'scale'],
          options: { isVisible: isMenuOpen },
          customVariants: {
            visible: {
              x: isMobileView ? '-50%' : 0,
              display: 'flex'
            },
            hidden: {
              x: isMobileView ? '-50%' : 0,
              transitionEnd: { display: 'none' }
            }
          }
        })}
        className={clsm([
          'bg-lightMode-gray-light',
          'dark:bg-darkMode-gray',
          'absolute',
          'flex-col',
          'gap-4',
          'mt-2',
          'origin-top-left',
          'p-4',
          'rounded-3xl',
          'w-[223px]',
          isMobileView && ['left-1/2', 'origin-top']
        ])}
      >
        {!isOwnChannel && (
          <Button
            variant="tertiaryText"
            onClick={moderationHandler}
            ref={moderateUserButton}
            className={clsm(BUTTON_TEXT_CLASSES)}
          >
            {isChannelBanned ? (
              <PersonAddIcon className={IconClasses} />
            ) : (
              <PersonOffIcon className={IconClasses} />
            )}
            <p>{isChannelBanned ? $content.unban_user : $content.ban_user}</p>
          </Button>
        )}
        <Button
          variant="tertiaryText"
          onClick={copyChannelLinkHandler}
          className={clsm(BUTTON_TEXT_CLASSES)}
        >
          <LinkIcon className={IconClasses} />
          <p>{$content.copy_channel_link}</p>
        </Button>
      </motion.div>
    </>
  );
};

ProfileViewMenu.propTypes = { channelUsername: PropTypes.string.isRequired };

export default ProfileViewMenu;
