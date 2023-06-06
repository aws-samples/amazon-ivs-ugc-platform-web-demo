import { clsm } from '../../../utils';
import { Provider as NotificationProvider } from '../../../contexts/Notification';
import Chat from '../../Channel/Chat';
import Poll from '../../Channel/Chat/Poll/Poll';
import { usePoll } from '../../../contexts/StreamManagerActions/Poll';

const StreamManagerChat = () => {
  const { containerMinHeight, isActive } = usePoll();

  return (
    <section
      style={isActive && { minHeight: containerMinHeight }}
      className={clsm([
        'relative',
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'flex-1',
        'flex',
        'overflow-hidden',
        'rounded-3xl',
        'w-full'
      ])}
    >
      <NotificationProvider>
        <Poll />
        <Chat />
      </NotificationProvider>
    </section>
  );
};

export default StreamManagerChat;
