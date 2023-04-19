import { useRef } from 'react';

import { clsm } from '../../../utils';
import { Provider as NotificationProvider } from '../../../contexts/Notification';
import Chat from '../../Channel/Chat';

const StreamManagerChat = () => {
  const chatSectionRef = useRef();

  return (
    <section
      ref={chatSectionRef}
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'flex-1',
        'flex',
        'h-full',
        'overflow-hidden',
        'relative',
        'rounded-3xl',
        'w-full'
      ])}
    >
      <NotificationProvider>
        <Chat chatSectionRef={chatSectionRef} />
      </NotificationProvider>
    </section>
  );
};

export default StreamManagerChat;
