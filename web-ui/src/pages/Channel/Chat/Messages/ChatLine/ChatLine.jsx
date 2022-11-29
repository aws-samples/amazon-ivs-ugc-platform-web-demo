import { decode } from 'html-entities';
import { forwardRef, useCallback, useRef } from 'react';
import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import {
  CHATLINE_BASE_CLASSES as chatLineBaseClasses,
  CHATLINE_HOVER_AND_FOCUS_CLASSES as chatLineHoverAndFocusClasses,
  CHATLINE_VARIANT_CLASSES as chatLineVariantClasses,
  TEXT_BASE_CLASSES as chatTextBaseClasses,
  TEXT_VARIANT_CLASSES as chatTextVariantClasses
} from './ChatLineTheme';
import { clsm } from '../../../../../utils';
import { createAnimationProps } from '../../../../../utils/animationPropsHelper';
import { useLastFocusedElement } from '../../../../../contexts/LastFocusedElement';
import UserAvatar from '../../../../../components/UserAvatar';

export const CHAT_LINE_VARIANT = { MESSAGE: 'message', POPUP: 'popup' };

const ChatLine = ({
  avatar,
  color,
  displayName,
  isFocusable,
  message,
  onClick,
  shouldAnimateIn,
  shouldAnimateOut,
  variant
}) => {
  const isStaticChatLine = !onClick;
  const chatLineClasses = clsm(
    chatLineBaseClasses,
    chatLineVariantClasses[variant],
    !isStaticChatLine && chatLineHoverAndFocusClasses
  );
  const chatTextClasses = clsm(
    chatTextBaseClasses,
    chatTextVariantClasses[variant]
  );
  const { setLastFocusedElement } = useLastFocusedElement();
  const chatLineRef = useRef();

  const handleChatLineButtonClick = useCallback(
    (event) => {
      setLastFocusedElement(chatLineRef.current);
      onClick(event);
    },
    [onClick, setLastFocusedElement]
  );

  return (
    <ChatLineWrapper
      {...createAnimationProps({
        animations: ['fadeIn-full', 'scale'],
        transition: { duration: 0.075, type: 'tween' },
        options: { shouldAnimateIn, shouldAnimateOut }
      })}
      className={chatLineClasses}
      chatLineVariant={variant}
      isStaticChatLine={isStaticChatLine}
      ref={chatLineRef}
      {...(!isFocusable ? { tabIndex: -1 } : {})}
      {...(variant === CHAT_LINE_VARIANT.MESSAGE && !isStaticChatLine
        ? {
            'aria-label': `Select ${displayName.toLowerCase()}'s message `,
            onClick: handleChatLineButtonClick
          }
        : {})}
    >
      <UserAvatar
        avatarName={avatar}
        profileColor={color}
        size={variant === CHAT_LINE_VARIANT.MESSAGE ? 'sm' : 'md'}
      />
      <p className={chatTextClasses}>
        <b>{displayName}</b> {decode(message).replace(/\\/g, '\\\\')}
      </p>
    </ChatLineWrapper>
  );
};

const ChatLineWrapper = forwardRef(
  ({ children, chatLineVariant, isStaticChatLine, ...restProps }, ref) => {
    if (chatLineVariant === CHAT_LINE_VARIANT.MESSAGE && !isStaticChatLine)
      return (
        <m.button ref={ref} {...restProps}>
          {children}
        </m.button>
      );
    if (chatLineVariant === CHAT_LINE_VARIANT.POPUP || isStaticChatLine)
      return <m.div {...restProps}>{children}</m.div>;
    return null;
  }
);

ChatLineWrapper.propTypes = {
  chatLineVariant: PropTypes.oneOf(Object.values(CHAT_LINE_VARIANT)).isRequired,
  children: PropTypes.node.isRequired,
  isStaticChatLine: PropTypes.bool.isRequired
};

ChatLine.defaultProps = {
  isFocusable: true,
  onClick: null,
  shouldAnimateIn: true,
  shouldAnimateOut: true,
  variant: CHAT_LINE_VARIANT.MESSAGE
};

ChatLine.propTypes = {
  avatar: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  displayName: PropTypes.string.isRequired,
  isFocusable: PropTypes.bool,
  message: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  shouldAnimateIn: PropTypes.bool,
  shouldAnimateOut: PropTypes.bool,
  variant: PropTypes.oneOf(Object.values(CHAT_LINE_VARIANT))
};

export default ChatLine;
