import { clsm } from '../../../utils';
import Chat from '../../Channel/Chat';
import Poll from '../../Channel/Chat/Poll/Poll';
import { usePoll } from '../../../contexts/StreamManagerActions/Poll';
import JoinRequest from '../../Channel/Chat/Poll/JoinRequest';

const ChatManager = () => {
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
        'rounded-l',
        'w-full',
        'h-full',
      ])}
    >

      {hasVotes && <Poll />}
      <Chat />
      <JoinRequest/>

    </section>
  );
};

export default ChatManager;
