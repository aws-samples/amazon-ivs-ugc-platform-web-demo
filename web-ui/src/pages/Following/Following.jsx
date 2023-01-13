import { following as $followPageContent } from '../../content';
import GridLayout from '../../components/GridLayout';
import withVerticalScroller from '../../components/withVerticalScroller';
import { useCallback, useEffect, useState } from 'react';
import mockFollowingData from '../../mocks/following.json';
import ChannelCard from '../../components/ChannelCard';
import { getAvatarSrc } from '../../helpers';

const $followPage = $followPageContent.following_page;
const $followingNotifications = $followPageContent.notification;

const Following = () => {
  const [data, setData] = useState();
  const { channels: followingData } = data || {};
  const hasData = !!followingData?.length;
  const isLoading = !data;

  const getSectionData = useCallback(() => setData(mockFollowingData), []);

  useEffect(() => {
    setTimeout(() => {
      getSectionData();
    }, 500);
  }, [getSectionData]);

  return (
    <GridLayout
      title={$followPage.title}
      loadingError={$followingNotifications.error.error_loading_followers}
      noDataText={$followPage.no_followers_available}
      tryAgainText={$followingNotifications.error.try_again}
      tryAgainFn={getSectionData}
      hasData={hasData}
      isLoading={isLoading}
    >
      {hasData &&
        followingData.map((data) => {
          const { color, username } = data;
          return (
            <ChannelCard
              avatarSrc={getAvatarSrc(data)}
              bannerSrc={data?.channelAssetUrls?.banner}
              color={color}
              key={data.username}
              username={username}
              variant={data.isLive ? 'live' : 'offline'}
            />
          );
        })}
    </GridLayout>
  );
};

export default withVerticalScroller(Following);
