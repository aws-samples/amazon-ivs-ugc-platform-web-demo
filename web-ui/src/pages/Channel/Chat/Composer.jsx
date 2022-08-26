import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { channel as $channelContent } from '../../../content';
import { CHAT_USER_ROLE } from './utils';
import { clsm } from '../../../utils';
import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import { useUser } from '../../../contexts/User';
import Input from '../../../components/Input';
import FloatingNav from '../../../components/FloatingNav';

const $content = $channelContent.chat;

const Composer = ({ chatUserRole, isDisabled, sendMessage }) => {
  const navigate = useNavigate();
  const { isMobileView } = useMobileBreakpoint();
  const { isSessionValid } = useUser();
  const [message, setMessage] = useState('');
  const canSendMessages =
    chatUserRole &&
    [CHAT_USER_ROLE.SENDER, CHAT_USER_ROLE.MODERATOR].includes(chatUserRole);

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (!canSendMessages) {
      navigate('/login');
    } else {
      !!message && sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className={clsm(['w-full', 'pt-5', 'pb-6', 'px-[18px]', 'z-50'])}>
      <form onSubmit={handleSendMessage}>
        <Input
          name="chatComposer"
          className={clsm([
            'bg-lightMode-gray',
            'dark:bg-darkMode-gray',
            'dark:focus:text-white',
            'dark:hover:bg-darkMode-gray-hover',
            'dark:hover:placeholder-white',
            'dark:hover:text-white',
            'dark:placeholder-darkMode-gray-light',
            'focus:bg-darkMode-gray-medium',
            'h-12',
            'placeholder-lightMode-gray-dark',
            isSessionValid && [
              'md:w-[calc(100%_-_60px)]',
              'touch-screen-device:lg:landscape:w-[calc(100%_-_60px)]'
            ]
          ])}
          placeholder={$content.say_something}
          onChange={(event) => setMessage(event.target.value)}
          value={message}
          isDisabled={isDisabled}
        />
      </form>
      {isMobileView && <FloatingNav />}
    </div>
  );
};

Composer.defaultProps = {
  chatUserRole: undefined,
  isDisabled: false
};

Composer.propTypes = {
  chatUserRole: PropTypes.oneOf(Object.values(CHAT_USER_ROLE)),
  isDisabled: PropTypes.bool,
  sendMessage: PropTypes.func.isRequired
};

export default Composer;
