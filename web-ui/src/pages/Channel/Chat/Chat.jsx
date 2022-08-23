import PropTypes from 'prop-types';
import { memo } from 'react';

import { clsm } from '../../../utils';
import Button from '../../../components/Button';
import Spinner from '../../../components/Spinner';
import useChat from './useChat';

const Chat = ({ chatRoomOwnerUsername, isChannelLoading }) => {
  const { isConnectionOpen, messages, sendMessage } = useChat(
    chatRoomOwnerUsername
  );

  console.log('messages:', messages);

  const handleSendMessage = () => {
    sendMessage('Hello World!');
  };

  return (
    <section
      className={clsm([
        'flex',
        'flex-col',
        'flex-shrink-0',
        'items-center',
        'justify-center',
        'gap-y-4',
        'w-[360px]',
        'h-screen',
        'bg-lightMode-gray-light',
        'dark:bg-darkMode-gray-dark',
        'lg:w-full',
        'lg:h-full',
        'lg:flex-grow',
        'lg:min-h-[360px]',
        'md:landscape:w-[308px]',
        'md:landscape:h-screen',
        'md:landscape:min-h-[auto]',
        'touch-screen-device:lg:landscape:w-[308px]',
        'touch-screen-device:lg:landscape:h-screen',
        'touch-screen-device:lg:landscape:min-h-[auto]'
      ])}
    >
      {isChannelLoading ? (
        <Spinner variant="light" size="medium" />
      ) : (
        <>
          <h2>Chat Section</h2>
          <Button onClick={handleSendMessage} isLoading={!isConnectionOpen}>
            Send Message
          </Button>
        </>
      )}
    </section>
  );
};

Chat.defaultProps = {
  chatRoomOwnerUsername: '',
  isChannelLoading: false
};

Chat.propTypes = {
  chatRoomOwnerUsername: PropTypes.string.isRequired,
  isChannelLoading: PropTypes.bool
};

export default memo(Chat);
