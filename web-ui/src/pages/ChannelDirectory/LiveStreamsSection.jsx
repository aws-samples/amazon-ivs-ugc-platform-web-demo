import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { channelDirectory as $channelDirectoryContent } from '../../content';
import { getAvatarSrc } from '../../helpers';
import { getLiveChannels } from '../../api/channels';
import { useNotif } from '../../contexts/Notification';
import ChannelCard from '../../components/ChannelCard';
import GridLayout from './GridLayout';

const $content = $channelDirectoryContent.live_streams_section;
const $channelPageNotifications = $channelDirectoryContent.notification;

const LiveStreamsSection = ({ isContentSectionCentered }) => {
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
      className={hasLiveChannels ? 'pb-24' : ''}
      hasError={!!error}
      hasData={hasLiveChannels}
      isContentSectionCentered={isContentSectionCentered}
      isLoading={isLoading}
      loadingError={$channelPageNotifications.error.error_loading_streams}
      noDataText={$content.no_streams_available}
      title={$content.title}
      tryAgainFn={getSectionData}
      tryAgainText={$channelPageNotifications.tryAgain}
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

LiveStreamsSection.defaultProps = {
  isContentSectionCentered: true
};

LiveStreamsSection.propTypes = {
  isContentSectionCentered: PropTypes.bool
};

export default LiveStreamsSection;
