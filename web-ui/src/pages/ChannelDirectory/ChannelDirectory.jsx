import { useEffect, useState } from 'react';

import { useUser } from '../../contexts/User';
import FollowingSection from './FollowingSection';
import LiveStreamsSection from './LiveStreamsSection';
import PageLayout from './PageLayout';
import withVerticalScroller from '../../components/withVerticalScroller';

const ChannelDirectory = () => {
  const [hasFollowingChannels, setHasFollowingChannels] = useState(false);
  const { isSessionValid } = useUser();

  useEffect(() => {
    if (isSessionValid)
      setTimeout(
        // TEMP - Simulate API call
        () => setHasFollowingChannels(true),
        1000
      );
    else setHasFollowingChannels(false);
  }, [isSessionValid, setHasFollowingChannels]);

  return (
    <PageLayout>
      <FollowingSection hasFollowingChannels={hasFollowingChannels} />
      <LiveStreamsSection isContentSectionCentered={hasFollowingChannels} />
    </PageLayout>
  );
};

export default withVerticalScroller(ChannelDirectory);
