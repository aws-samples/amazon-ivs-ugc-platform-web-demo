import { useUser } from '../../contexts/User';
import FollowingSection from './FollowingSection';
import LiveStreamsSection from './LiveStreamsSection';
import PageLayout from './PageLayout';
import withVerticalScroller from '../../components/withVerticalScroller';

const ChannelDirectory = () => {
  const { userData } = useUser();
  const { followingList } = userData || {};
  const hasFollowingListData = !!followingList?.length;

  return (
    <PageLayout>
      <FollowingSection followingList={followingList} />
      <LiveStreamsSection isContentSectionCentered={hasFollowingListData} />
    </PageLayout>
  );
};

export default withVerticalScroller(ChannelDirectory);
