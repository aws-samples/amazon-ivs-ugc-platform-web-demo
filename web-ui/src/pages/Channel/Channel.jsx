import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import './Channel.css';
import { userManagement } from '../../api';
import Player from '../../components/Player';
import withSessionLoader from '../../components/withSessionLoader';

const Channel = () => {
  const { username } = useParams();
  const [isLive, setIsLive] = useState();
  const [channelData, setChannelData] = useState();
  const fetchChannelData = useCallback(async () => {
    const { result } = await userManagement.getUserChannelData(username);

    if (result) setChannelData(result);
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchChannelData();
    }
  }, [fetchChannelData, username]);

  useEffect(() => {
    if (channelData?.isLive !== undefined) {
      setIsLive(channelData.isLive);
    }
  }, [channelData?.isLive]);

  return (
    <div className="channel">
      <Player
        isLive={isLive}
        setIsLive={setIsLive}
        playbackUrl={channelData?.playbackUrl}
      />
    </div>
  );
};

export default withSessionLoader(Channel);
