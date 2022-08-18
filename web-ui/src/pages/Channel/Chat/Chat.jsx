import PropTypes from 'prop-types';
import Spinner from '../../../components/Spinner';

import { clsm } from '../../../utils';
import { memo } from 'react';
import useChat from './useChat';

const Chat = ({ chatRoomOwnerUsername, isChannelLoading }) => {
  const { isConnectionOpen } = useChat(chatRoomOwnerUsername);

  console.info('isConnectionOpen:', isConnectionOpen);

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
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'hidden' // TEMPORARY - Remove when implementing Chat UI
      ])}
    >
      {isChannelLoading ? (
        <Spinner variant="light" size="medium" />
      ) : (
        <h2>Chat Section</h2>
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
