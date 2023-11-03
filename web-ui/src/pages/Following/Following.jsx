import { useEffect } from 'react';

import { following as $followPageContent } from '../../content';
import { getAvatarSrc } from '../../helpers';
import { useNotif } from '../../contexts/Notification';
import { useUser } from '../../contexts/User';
import ChannelCard from '../../components/ChannelCard';
import GridLayout from '../ChannelDirectory/GridLayout';
import PageLayout from '../ChannelDirectory/PageLayout';
import withVerticalScroller from '../../components/withVerticalScroller';
import useForceLoader from '../../hooks/useForceLoader';

const $followingNotificationsContent = $followPageContent.notification;

const Following = () => {
  const { notifyError } = useNotif();
  const { fetchUserFollowingList, hasErrorFetchingFollowingList, userData } =
    useUser();
  const isLoadingForced = useForceLoader();

  const { followingList } = userData || {};
  const hasFollowingListData = !!followingList?.length;

  useEffect(() => {
    if (hasErrorFetchingFollowingList)
      notifyError($followingNotificationsContent.error.error_loading_channels);
  }, [hasErrorFetchingFollowingList, notifyError]);

  return (
    <PageLayout>
      <GridLayout
        className={hasFollowingListData ? 'pb-24' : ''}
        hasData={hasFollowingListData}
        hasError={hasErrorFetchingFollowingList}
        isLoading={
          (followingList === undefined && !hasErrorFetchingFollowingList) ||
          isLoadingForced
        }
        loadingError={
          $followingNotificationsContent.error.error_loading_channels
        }
        noDataText={
          hasErrorFetchingFollowingList
            ? $followPageContent.failed_to_load_channels
            : $followPageContent.no_channels_followed
        }
        title={$followPageContent.title}
        tryAgainFn={fetchUserFollowingList}
        tryAgainText={$followingNotificationsContent.error.try_again}
      >
        {hasFollowingListData &&
          followingList.map((followedChannel) => {
            const { channelAssetUrls, color, isLive, username, stageId } =
              followedChannel;
            const isChannelLive = isLive || !!stageId;

            return (
              <ChannelCard
                avatarSrc={getAvatarSrc(followedChannel)}
                bannerSrc={channelAssetUrls?.banner}
                color={color}
                key={username}
                username={username}
                variant={isChannelLive ? 'live' : 'offline'}
              />
            );
          })}
      </GridLayout>
    </PageLayout>
  );
};

export default withVerticalScroller(Following);
