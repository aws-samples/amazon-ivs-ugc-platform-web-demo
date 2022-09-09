import PropTypes from 'prop-types';
import { m } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

import {
  COMPOSER_MAX_CHARACTER_LENGTH,
  COMPOSER_RATE_LIMIT_BLOCK_TIME_MS
} from '../../../constants';
import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE, SEND_ERRORS } from './useChatConnection/utils';
import { clsm } from '../../../utils';
import { Lock } from '../../../assets/icons';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import ComposerErrorMessage from './ComposerErrorMessage';
import FloatingNav from '../../../components/FloatingNav';
import Input from '../../../components/Input';

const $content = $channelContent.chat;

const Composer = ({
  chatUserRole,
  isDisabled,
  isLocked,
  sendError,
  sendMessage
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const composerFieldRef = useRef();
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid } = useUser();
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shouldShake, setShouldShake] = useState(false); // Composer has shake animated only on submit
  const [blockChat, setBlockChat] = useState(false);
  const canSendMessages =
    chatUserRole &&
    [CHAT_USER_ROLE.SENDER, CHAT_USER_ROLE.MODERATOR].includes(chatUserRole);
  const focus = location.state?.focus;

  useEffect(() => {
    // If previous route has focus state, focus on composer
    if (focus && focus === 'COMPOSER') {
      composerFieldRef.current.focus();
    }
  }, [focus]);

  useEffect(() => {
    // If user is banned, remove any message
    if (isLocked) setMessage('');
  }, [isLocked]);

  useEffect(() => {
    const blockChatTimer = () => {
      if (blockChat) {
        setTimeout(() => {
          setBlockChat(false);
          setErrorMessage('');
        }, COMPOSER_RATE_LIMIT_BLOCK_TIME_MS);
      }
    };
    blockChatTimer();
    return () => clearTimeout(blockChatTimer);
  }, [blockChat]);

  useEffect(() => {
    // Send errors
    if (sendError) {
      let _errorMessage = '';
      if (sendError.message === SEND_ERRORS.RATE_LIMIT_EXCEEDED) {
        setBlockChat(true);
        _errorMessage = $content.error.error_rate_exceeded;
      } else if (sendError.message === SEND_ERRORS.MAX_LENGTH_EXCEEDED) {
        _errorMessage = $content.error.error_max_length_reached;
      }
      setErrorMessage(
        `${$content.error.error_message_not_sent} ${_errorMessage}`
      );
      setShouldShake(true);
    }
  }, [sendError]);

  const navigateToLogin = () =>
    navigate('/login', { state: { from: location, focus: 'COMPOSER' } });

  const handleOnChange = (event) => {
    if (canSendMessages) {
      const { value } = event.target;
      setMessage(value);
      // On change errors
      if (value.length > COMPOSER_MAX_CHARACTER_LENGTH) {
        setErrorMessage($content.error.error_max_length_reached);
      } else if (!blockChat) {
        setErrorMessage('');
      }
    } else {
      navigateToLogin();
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (canSendMessages) {
      if (!message || blockChat) return;
      sendMessage(message);
      !errorMessage && setMessage('');
      setShouldShake(false);
    } else {
      navigateToLogin();
    }
  };

  return (
    <div className={clsm(['w-full', 'pt-5', 'pb-6', 'px-[18px]'])}>
      <m.div
        animate={shouldShake ? 'shake' : 'default'}
        variants={{
          shake: { x: [12, -12, 8, -8, 4, 0] },
          default: { x: 0 }
        }}
        transition={{ duration: 0.5 }}
      >
        <form
          className={clsm(
            ['relative', 'z-510'],
            isSessionValid && [
              'md:w-[calc(100%_-_60px)]',
              'touch-screen-device:lg:landscape:w-[calc(100%_-_60px)]'
            ]
          )}
          onSubmit={handleSendMessage}
        >
          <div>
            <ComposerErrorMessage errorMessage={errorMessage} />
            <Input
              ref={composerFieldRef}
              autoComplete="off"
              name="chatComposer"
              className={clsm(
                [
                  'bg-lightMode-gray',
                  'dark:bg-darkMode-gray',
                  'dark:focus:text-white',
                  'dark:hover:bg-darkMode-gray-hover',
                  'dark:hover:placeholder-white',
                  'dark:hover:text-white',
                  'dark:placeholder-darkMode-gray-light',
                  'focus:bg-darkMode-gray-medium',
                  'h-12',
                  'placeholder-lightMode-gray-dark'
                ],
                errorMessage && [
                  'dark:focus:shadow-darkMode-red',
                  'dark:focus:shadow-focus',
                  'rounded-b-3xl',
                  'rounded-t-none'
                ],
                isLocked && ['pr-[60px]', 'read-only:cursor-not-allowed'],
                isDisabled && ['opacity-30']
              )}
              placeholder={
                isLocked ? $content.you_are_banned : $content.say_something
              }
              onChange={handleOnChange}
              value={message}
              isRequired={false}
              error={errorMessage ? '' : null}
              readOnly={isDisabled || isLocked}
              ariaLabel={isDisabled ? 'Chat disabled' : null}
            />
            {isLocked && (
              <span
                className={clsm([
                  '[&>svg]:h-6',
                  '[&>svg]:w-6',
                  'absolute',
                  'bottom-3',
                  'cursor-not-allowed',
                  'dark:fill-darkMode-gray-light',
                  'right-6',
                  'top-3'
                ])}
              >
                <Lock />
              </span>
            )}
          </div>
        </form>
      </m.div>
      {isMobileView && <FloatingNav />}
    </div>
  );
};

Composer.defaultProps = {
  chatUserRole: undefined,
  isDisabled: false,
  isLocked: false,
  sendError: null
};

Composer.propTypes = {
  chatUserRole: PropTypes.oneOf(Object.values(CHAT_USER_ROLE)),
  isDisabled: PropTypes.bool,
  isLocked: PropTypes.bool,
  sendMessage: PropTypes.func.isRequired,
  sendError: PropTypes.shape({
    message: PropTypes.string
  })
};

export default Composer;
