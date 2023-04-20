import { clsm } from '../../../utils';
import { Provider as NotificationProvider } from '../../../contexts/Notification';
import Chat from '../../Channel/Chat';

const StreamManagerChat = () => (
  <section
    className={clsm([
      'bg-lightMode-gray-extraLight',
      'dark:bg-darkMode-gray-dark',
      'flex-1',
      'flex',
      'h-full',
      'overflow-hidden',
      'rounded-3xl',
      'w-full'
    ])}
  >
    <NotificationProvider>
      <Chat />
    </NotificationProvider>
  </section>
);

export default StreamManagerChat;
