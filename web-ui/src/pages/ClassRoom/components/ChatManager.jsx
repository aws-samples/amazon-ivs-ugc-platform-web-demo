import { clsm } from '../../../utils';
import Chat from '../../Channel/Chat';
import Poll from '../../Channel/Chat/Poll/Poll';
import { usePoll } from '../../../contexts/StreamManagerActions/Poll';
import JoinRequest from '../../Channel/Chat/Poll/JoinRequest';
import { useMediaCanvas } from '../hooks/useMediaCanvas';

const ChatManager = () => {
  const { isActive, containerMinHeight, hasVotes } = usePoll();
  const { isWhiteBoardActive, toggleWhiteBoard,isSmall } = useMediaCanvas();

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
        isWhiteBoardActive?'h-3/4':'h-full'
      ])}
    >
      
      {hasVotes && <Poll />}
      <Chat />
      <JoinRequest/>

    </section>
  );
};

export default ChatManager;
