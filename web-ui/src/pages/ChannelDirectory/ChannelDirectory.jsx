import { useEffect, useState } from 'react';

import FollowingSection from './FollowingSection';
import LiveStreamsSection from './LiveStreamsSection';
import withVerticalScroller from '../../components/withVerticalScroller';
import PageLayout from './PageLayout';

const ChannelDirectory = () => {
  const [hasFollowingChannels, setHasFollowingChannels] = useState(false);

  useEffect(() => {
    setTimeout(() => setHasFollowingChannels(true), 1000); // TEMP - Simulate API call
  }, [setHasFollowingChannels]);

  return (
    <PageLayout>
      <FollowingSection hasFollowingChannels={hasFollowingChannels} />
      <LiveStreamsSection isContentSectionCentered={hasFollowingChannels} />
    </PageLayout>
  );
};

export default withVerticalScroller(ChannelDirectory);
