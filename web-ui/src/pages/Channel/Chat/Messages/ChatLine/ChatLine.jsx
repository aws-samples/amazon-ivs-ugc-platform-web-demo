import { decode } from 'html-entities';
import { m } from 'framer-motion';
import { useCallback } from 'react';
import PropTypes from 'prop-types';

import { CHAT_LINE_VARIANT } from '../../utils';
import {
  CHATLINE_BASE_CLASSES as baseClasses,
  TEXT_BASE_CLASSES as textBaseClasses,
  TEXT_VARIANT_CLASSES as textClasses,
  CHATLINE_VARIANT_CLASSES as variantClasses
} from './ChatLineTheme';
import { clsm } from '../../../../../utils';
import UserAvatar from '../../../../../components/UserAvatar';

const defaultTransition = { duration: 0.25, type: 'tween' };

const ChatLine = ({
  message,
  avatar,
  color,
  displayName,
  openChatPopup,
  variant
}) => {
  const classes = clsm([baseClasses, ...variantClasses[variant]]);

  const selectMessage = useCallback(() => {
    openChatPopup(message, avatar, color, displayName);
  }, [openChatPopup, message, avatar, color, displayName]);

  return (
    <ChatLineWrapper
      animate="visible"
      initial="hidden"
      exit="hidden"
      variants={{
        visible: { opacity: 1, scale: 1 },
        hidden: { opacity: 0, scale: 0.9 }
      }}
      transition={defaultTransition}
      className={classes}
      chatLineVariant={variant}
      {...(variant === CHAT_LINE_VARIANT.MESSAGE
        ? {
            'aria-label': `Select ${displayName.toLowerCase()}'s message `,
            onClick: selectMessage
          }
        : {})}
    >
      <UserAvatar
        avatarName={avatar}
        profileColor={color}
        size={variant === CHAT_LINE_VARIANT.MESSAGE ? 'sm' : 'md'}
      />
      <p className={clsm([...textBaseClasses, textClasses[variant]])}>
        <b>{displayName}</b>
        &nbsp;
        {decode(message).replace(/\\/g, '\\\\')}
      </p>
    </ChatLineWrapper>
  );
};

const ChatLineWrapper = ({ children, chatLineVariant, ...restProps }) => {
  if (chatLineVariant === CHAT_LINE_VARIANT.MESSAGE)
    return <m.button {...restProps}>{children}</m.button>;

  if (chatLineVariant === CHAT_LINE_VARIANT.POPUP)
    return <m.div {...restProps}>{children}</m.div>;

  return null;
};

ChatLineWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  chatLineVariant: PropTypes.oneOf(Object.values(CHAT_LINE_VARIANT)).isRequired
};

ChatLine.defaultProps = {
  variant: CHAT_LINE_VARIANT.MESSAGE
};

ChatLine.propTypes = {
  message: PropTypes.string.isRequired,
  avatar: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  openChatPopup: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(Object.values(CHAT_LINE_VARIANT))
};

export default ChatLine;
