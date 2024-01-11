import { encode } from 'html-entities';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import {
  COMPOSER_MAX_CHARACTER_LENGTH,
  COMPOSER_RATE_LIMIT_BLOCK_TIME_MS
} from '../../../constants';
import { CHAT_MESSAGE_EVENT_TYPES } from '../../../constants';
import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE, SEND_ERRORS } from './useChatConnection/utils';
import { clsm } from '../../../utils';
import { Lock } from '../../../assets/icons';
import { useChannel } from '../../../contexts/Channel';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useUser } from '../../../contexts/User';
import ComposerErrorMessage from './ComposerErrorMessage';
import FloatingNav from '../../../components/FloatingNav';
import Input from '../../../components/Input';
import useCurrentPage from '../../../hooks/useCurrentPage';
import { usePoll } from '../../../contexts/StreamManagerActions/Poll';

const { SEND_MESSAGE } = CHAT_MESSAGE_EVENT_TYPES;

const $content = $channelContent.chat;

const Composer = ({
  chatUserRole,
  isDisabled,
  isFocusable,
  isLoading,
  sendAttemptError,
  sendMessage
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const composerFieldRef = useRef();
  const { channelData } = useChannel();
  const { isViewerBanned: isLocked } = channelData || {};
  const { isLandscape } = useResponsiveDevice();
  const { isSessionValid } = useUser();
  const { setComposerRefState } = usePoll();
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shouldShake, setShouldShake] = useState(false); // Composer has shake animated only on submit
  const [blockChat, setBlockChat] = useState(false);
  const currentPage = useCurrentPage();
  const isStreamManagerPage = currentPage === 'stream_manager' || 'stage_manager';
  const canSendMessages =
    chatUserRole &&
    [CHAT_USER_ROLE.SENDER, CHAT_USER_ROLE.MODERATOR].includes(chatUserRole);
  const focus = location.state?.focus;

  useEffect(() => {
    if (composerFieldRef.current) {
      setComposerRefState(composerFieldRef);
    }
  }, [composerFieldRef, setComposerRefState]);

  const setSubmitErrorStates = (_errorMessage) => {
    setErrorMessage(`${$content.error.message_not_sent} ${_errorMessage}`);
    setShouldShake(true);
  };

  const navigateToLogin = () =>
    navigate('/login', { state: { from: location, focus: 'COMPOSER' } });

  const handleOnChange = (event) => {
    // If the user isn't logged in, redirect them to the login page
    if ((!isLoading && canSendMessages === false) || !isSessionValid) {
      navigateToLogin();
    }

    const { value } = event.target;
    const encodedValue = encode(value);
    // This is done to ensure we get the correct message length as it seems the IVS Chat API trims the message before checking its length
    const trimmedValue = encodedValue.trim();

    setMessage(value);

    // On change errors
    if (trimmedValue.length > COMPOSER_MAX_CHARACTER_LENGTH) {
      setErrorMessage($content.error.max_length_reached);
    } else if (!blockChat) {
      setErrorMessage('');
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (isDisabled) return;

    if (isLoading) {
      setSubmitErrorStates($content.error.wait_until_connected);
    } else {
      if (canSendMessages) {
        if (!message || blockChat) return;
        if (errorMessage.includes($content.error.wait_until_connected)) {
          setErrorMessage('');
          setMessage('');
        }

        sendMessage(message, { eventType: SEND_MESSAGE });
        !errorMessage && setMessage('');
        setShouldShake(false);
      } else {
        if (canSendMessages === undefined) {
          setSubmitErrorStates($content.error.wait_until_connected);
        } else {
          navigateToLogin();
        }
      }
    }
  };

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
    // If there is a connection error, clear the current error message
    if (isDisabled) setErrorMessage('');
  }, [isDisabled]);

  useEffect(() => {
    if (blockChat) {
      const blockChatTimerId = setTimeout(() => {
        setBlockChat(false);
        setErrorMessage('');
      }, COMPOSER_RATE_LIMIT_BLOCK_TIME_MS);

      return () => clearTimeout(blockChatTimerId);
    }
  }, [blockChat]);

  useEffect(() => {
    // Send errors
    if (sendAttemptError) {
      let sendAttemptErrorMessage = '';

      if (sendAttemptError.message === SEND_ERRORS.RATE_LIMIT_EXCEEDED) {
        setBlockChat(true);
        sendAttemptErrorMessage = $content.error.rate_exceeded;
      } else if (sendAttemptError.message === SEND_ERRORS.MAX_LENGTH_EXCEEDED) {
        sendAttemptErrorMessage = $content.error.max_length_reached;
      }

      // connection error or chat is loading (chat is not connected)
      setSubmitErrorStates(sendAttemptErrorMessage);
    }
  }, [sendAttemptError, isLoading]);

  return (
    <div className={clsm(['w-full', 'pt-5', 'pb-6', 'px-[18px]'])}>
      <motion.div
        animate={shouldShake ? 'shake' : 'default'}
        variants={{
          shake: { x: [12, -12, 8, -8, 4, 0] },
          default: { x: 0 }
        }}
        transition={{ duration: 0.5 }}
      >
        <form
          className={clsm(
            'relative',
            isSessionValid && [
              'md:w-[calc(100%_-_60px)]',
              isLandscape && 'touch-screen-device:lg:w-[calc(100%_-_60px)]'
            ]
          )}
          onSubmit={handleSendMessage}
        >
          <div>
            <ComposerErrorMessage errorMessage={errorMessage} />
            <Input
              {...(!isFocusable ? { tabIndex: -1 } : {})}
              ariaLabel={isDisabled ? 'Chat disabled' : null}
              autoComplete="off"
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
                  'dark:shadow-darkMode-red',
                  'focus:shadow-lightMode-red',
                  'rounded-b-3xl',
                  'rounded-t-none',
                  'shadow-lightMode-red'
                ],
                isLocked && [
                  'dark:read-only:focus:bg-darkMode-gray',
                  'dark:read-only:hover:bg-darkMode-gray',
                  'dark:read-only:hover:placeholder-darkMode-gray-light',
                  'pr-[60px]',
                  'read-only:cursor-not-allowed',
                  'read-only:focus:bg-lightMode-gray',
                  'read-only:focus:shadow-none',
                  'read-only:hover:bg-lightMode-gray',
                  'read-only:hover:placeholder-lightMode-gray-dark',
                  'read-only:hover:placeholder-lightMode-gray-medium'
                ],
                isDisabled && ['opacity-30']
              )}
              error={errorMessage ? '' : null}
              isRequired={false}
              name="chatComposer"
              onChange={handleOnChange}
              placeholder={
                isLocked ? $content.you_are_banned : $content.say_something
              }
              readOnly={isDisabled || isLocked}
              ref={composerFieldRef}
              value={message}
            />
            {isLocked && (
              <span
                className={clsm([
                  '[&>svg]:fill-lightMode-gray-medium',
                  '[&>svg]:h-6',
                  '[&>svg]:w-6',
                  'absolute',
                  'bottom-3',
                  'cursor-not-allowed',
                  'dark:[&>svg]:fill-darkMode-gray-light',
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
      </motion.div>
      <FloatingNav
        {...(isStreamManagerPage && {
          containerClassName: (isOpen) =>
            clsm([
              'max-h-[min(650px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_72px))]',
              isOpen && ['bottom-12', 'right-[52px]', 'sm:right-9']
            ]),
          menuClassName: clsm([
            'lg:w-[calc(100vw_-_104px)]',
            'sm:w-[calc(100vw_-_72px)]',
            isLandscape && [
              'fixed',
              'max-h-[min(570px,calc(calc(var(--mobile-vh,1vh)_*_100)_-_126px))]',
              'right-[52px]',
              'sm:right-[36px]',
              'sm:w-full',
              'max-w-[400px]',
              'bottom-[112px]',
              'sm:w-[calc(100vw_-_72px)]'
            ]
          ])
        })}
      />
    </div>
  );
};

Composer.defaultProps = {
  chatUserRole: undefined,
  isDisabled: false,
  isFocusable: true,
  isLoading: true,
  sendAttemptError: null
};

Composer.propTypes = {
  chatUserRole: PropTypes.oneOf(Object.values(CHAT_USER_ROLE)),
  isDisabled: PropTypes.bool,
  isFocusable: PropTypes.bool,
  isLoading: PropTypes.bool,
  sendAttemptError: PropTypes.shape({ message: PropTypes.string }),
  sendMessage: PropTypes.func.isRequired
};

export default Composer;
