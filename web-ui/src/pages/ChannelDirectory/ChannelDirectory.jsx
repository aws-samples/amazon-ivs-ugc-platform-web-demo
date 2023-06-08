import FollowingSection from './FollowingSection';
import LiveStreamsSection from './LiveStreamsSection';
import PageLayout from './PageLayout';
import withVerticalScroller from '../../components/withVerticalScroller';

const ChannelDirectory = () => {
  return (
    <PageLayout>
      <FollowingSection />
      <LiveStreamsSection />
    </PageLayout>
  );
};

export default withVerticalScroller(ChannelDirectory);
