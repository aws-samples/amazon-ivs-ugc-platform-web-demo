import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clsm } from '../../utils';

import Chat from './Chat';
import PageUnavailable from '../../components/PageUnavailable';
import Player from '../../components/Player';
import useChannelData from '../../hooks/useChannelData';

const Channel = () => {
  const { username } = useParams();
  const [isLive, setIsLive] = useState();
  const { data: channelData, isLoading } = useChannelData(username);
  const isChannelAvailable = !!channelData;

  useEffect(() => {
    if (channelData?.isLive !== undefined) {
      setIsLive(channelData.isLive);
    }
  }, [channelData?.isLive]);

  if (!isLoading && !isChannelAvailable) {
    return <PageUnavailable />;
  }

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
