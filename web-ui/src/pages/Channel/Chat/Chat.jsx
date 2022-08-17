import PropTypes from 'prop-types';
import { memo } from 'react';

import { clsm } from '../../../utils';
import useChat from './useChat';

const Chat = ({ chatRoomOwnerUsername }) => {
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
      <h2>Chat Section</h2>
    </section>
  );
};

Chat.propTypes = { chatRoomOwnerUsername: PropTypes.string.isRequired };

export default memo(Chat);
