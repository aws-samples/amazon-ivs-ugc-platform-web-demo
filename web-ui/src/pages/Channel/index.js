import { Provider as ChannelViewProvider } from './contexts/ChannelView';
import { Provider as ProfileViewAnimationProvider } from './contexts/ProfileViewAnimation';
import ChannelPage from './Channel';

export default function Channel() {
  return (
    <ChannelViewProvider>
      <ProfileViewAnimationProvider>
        <ChannelPage />
      </ProfileViewAnimationProvider>
    </ChannelViewProvider>
  );
}
