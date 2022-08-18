import './Settings.css';
import { dashboard as $content } from '../../content';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useUser } from '../../contexts/User';
import AccountSettings from './AccountSettings';
import FloatingPlayer from '../StreamHealth/FloatingPlayer';
import StreamSettings from './StreamSettings';
import withVerticalScroller from '../../components/withVerticalScroller';

const Settings = () => {
  const { userData } = useUser();
  const { isMobileView } = useMobileBreakpoint();

  return (
    userData && (
      <>
        <article className="settings-container">
          <h1>{$content.settings_page.title}</h1>
          <StreamSettings />
          <AccountSettings />
        </article>
        {!isMobileView && <FloatingPlayer />}
      </>
    )
  );
};

export default withVerticalScroller(Settings);
