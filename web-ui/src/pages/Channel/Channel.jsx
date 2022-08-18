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
  const {
    isLive: isChannelLive,
    playbackUrl,
    username: channelUsername
  } = channelData || {};

  useEffect(() => {
    if (isChannelAvailable) setIsLive(isChannelLive);
  }, [isChannelAvailable, isChannelLive]);

  if (!isLoading && !isChannelAvailable) {
    return <PageUnavailable />;
  }

  return (
    <div
      className={clsm(
        'flex',
        'flex-row',
        'items-center',
        'justify-center',
        'text-center',
        'h-full',
        'w-full'
      )}
    >
      <Player isLive={isLive} setIsLive={setIsLive} playbackUrl={playbackUrl} />
      <Chat
        chatRoomOwnerUsername={channelUsername}
        isChannelLoading={isLoading}
      />
    </div>
  );
};

export default Channel;
