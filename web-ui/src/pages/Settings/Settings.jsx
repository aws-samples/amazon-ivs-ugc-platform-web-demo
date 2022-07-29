import { dashboard as $content } from '../../content';
import { useUser } from '../../contexts/User';
import AccountSettings from './AccountSettings';
import StreamSettings from './StreamSettings';
import withVerticalScroller from '../../components/withVerticalScroller/withVerticalScroller';
import './Settings.css';

const Settings = () => {
  const { userData } = useUser();

  return (
    userData && (
      <article className="settings-container">
        <h1>{$content.settings_page.title}</h1>
        <StreamSettings />
        <AccountSettings />
      </article>
    )
  );
};

export default withVerticalScroller(Settings);
