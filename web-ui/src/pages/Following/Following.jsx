import { useCallback, useEffect, useState } from 'react';

import { following as $followPageContent } from '../../content';
import { getAvatarSrc } from '../../helpers';
import ChannelCard from '../../components/ChannelCard';
import GridLayout from '../ChannelDirectory/GridLayout';
import mockFollowingData from '../../mocks/following.json';
import PageLayout from '../ChannelDirectory/PageLayout';
import withVerticalScroller from '../../components/withVerticalScroller';

const $followPage = $followPageContent.following_page;
const $followingNotifications = $followPageContent.notification;

const Following = () => {
  const [data, setData] = useState();
  const { channels: followedChannels } = data || {};
  const hasData = !!followedChannels?.length;
  const isLoading = !data;

  const getSectionData = useCallback(() => setData(mockFollowingData), []);

  useEffect(() => {
    setTimeout(() => {
      getSectionData();
    }, 500);
  }, [getSectionData]);

  return (
    <PageLayout>
      <GridLayout
        className={hasData ? 'pb-24' : ''}
        hasData={hasData}
        isLoading={isLoading}
        loadingError={$followingNotifications.error.error_loading_followers}
        noDataText={$followPage.no_followers_available}
        title={$followPage.title}
        tryAgainFn={getSectionData}
        tryAgainText={$followingNotifications.error.try_again}
      >
        {hasData &&
          followedChannels.map((followedChannel) => {
            const { channelAssetUrls, color, isLive, username } =
              followedChannel;

            return (
              <ChannelCard
                avatarSrc={getAvatarSrc(followedChannel)}
                bannerSrc={channelAssetUrls?.banner}
                color={color}
                key={username}
                username={username}
                variant={isLive ? 'live' : 'offline'}
              />
            );
          })}
      </GridLayout>
    </PageLayout>
  );
};

export default withVerticalScroller(Following);
