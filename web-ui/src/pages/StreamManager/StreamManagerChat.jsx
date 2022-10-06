import { useRef } from 'react';
import PropTypes from 'prop-types';

import { clsm } from '../../utils';
import { Provider as NotificationProvider } from '../../contexts/Notification';
import Chat from '../Channel/Chat';

const StreamManagerChat = ({ siblingRef }) => {
  const chatContainerRef = useRef();

  return (
    <section
      ref={chatContainerRef}
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'flex',
        'h-full',
        'lg:min-h-[200px]',
        'overflow-hidden',
        'relative',
        'rounded-3xl',
        'w-full',
        'flex-1'
      ])}
    >
      <NotificationProvider>
        <Chat
          menuPopupSiblingRef={siblingRef}
          chatContainerRef={chatContainerRef}
        />
      </NotificationProvider>
    </section>
  );
};

StreamManagerChat.defaultProps = {
  siblingRef: null
};

StreamManagerChat.propTypes = {
  siblingRef: PropTypes.object
};

export default StreamManagerChat;
