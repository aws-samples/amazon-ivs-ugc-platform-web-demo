import { Provider as ChannelViewProvider } from './contexts/ChannelView';
import { Provider as ProfileViewAnimationProvider } from './contexts/ProfileViewAnimation';
import { Provider as PollProvider } from '../../contexts/StreamManagerActions/Poll';
import ChannelPage from './Channel';

export default function Channel() {
  return (
    <ChannelViewProvider>
      <PollProvider>
        <ProfileViewAnimationProvider>
          <ChannelPage />
        </ProfileViewAnimationProvider>
      </PollProvider>
    </ChannelViewProvider>
  );
}
