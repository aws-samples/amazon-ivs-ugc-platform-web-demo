import { clsm } from '../../../utils';
import Chat from '../../Channel/Chat';
import Poll from '../../Channel/Chat/Poll/Poll';
import { usePoll } from '../../../contexts/StreamManagerActions/Poll';

const StreamManagerChat = () => {
  const { isActive, containerMinHeight, hasVotes } = usePoll();

  return (
    <section
      style={{
        ...(isActive && {
          minHeight: containerMinHeight
        })
      }}
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
      {hasVotes && <Poll />}
      <Chat />
    </section>
  );
};

export default StreamManagerChat;
