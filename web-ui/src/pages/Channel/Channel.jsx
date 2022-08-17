import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clsm } from '../../utils';

import Chat from './Chat';
import Player from '../../components/Player';
import useChannelData from '../../hooks/useChannelData';

const Channel = () => {
  const { username } = useParams();
  const [isLive, setIsLive] = useState();
  const { data: channelData } = useChannelData(username);

  useEffect(() => {
    if (channelData?.isLive !== undefined) {
      setIsLive(channelData.isLive);
    }
  }, [channelData?.isLive]);

  return (
    <div
      className={clsm(
        'flex',
        'flex-col',
        'items-center',
        'justify-center',
        'text-center',
        'h-full',
        'w-full'
      )}
    >
      <Player
        isLive={isLive}
        setIsLive={setIsLive}
        playbackUrl={channelData?.playbackUrl}
      />
      <Chat chatRoomOwnerUsername={username} />
    </div>
  );
};

export default Channel;
