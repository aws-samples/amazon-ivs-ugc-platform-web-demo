import { useCallback, useEffect, useState } from 'react';

import { channelDirectory as $channelDirectoryContent } from '../../content';
import { getAvatarSrc } from '../../helpers';
import { getLiveChannels } from '../../api/channels';
import { useNotif } from '../../contexts/Notification';
import ChannelCard from '../../components/ChannelCard';
import GridLayout from '../../components/GridLayout';

const $channelPageContent = $channelDirectoryContent.live_streams_section;
const $channelPageNotifications = $channelDirectoryContent.notification;

const LiveStreamsSection = () => {
  const [data, setData] = useState();
  const [error, setError] = useState();
  const { channels: liveChannels } = data || {};
  const { notifyError } = useNotif();
  const hasLiveChannels = !!liveChannels?.length;
  const isLoading = !error && !data;

  const getSectionData = useCallback(async () => {
    setData(undefined);
    setError(undefined);

    const { result, error: fetchError } = await getLiveChannels();

    setData(result);
    setError(fetchError);

    if (fetchError)
      notifyError(
        $channelDirectoryContent.notification.error.error_loading_streams
      );
  }, [notifyError]);

  useEffect(() => {
    getSectionData();
  }, [getSectionData]);

  return (
    <GridLayout
      title={$channelPageContent.title}
      noDataText={$channelPageContent.no_streams_available}
      loadingError={$channelPageNotifications.error.error_loading_streams}
      tryAgainText={$channelPageNotifications.tryAgain}
      tryAgainFn={getSectionData}
      hasData={hasLiveChannels}
      isLoading={isLoading}
      error={error}
    >
      {hasLiveChannels &&
        liveChannels.map((data) => {
          const { color, username } = data;
          return (
            <ChannelCard
              avatarSrc={getAvatarSrc(data)}
              bannerSrc={data?.channelAssetUrls?.banner}
              color={color}
              key={data.username}
              username={username}
            />
          );
        })}
    </GridLayout>
  );
};

export default LiveStreamsSection;
