import { dashboard as $content } from '../../../../content';
import { useUser } from '../../../../contexts/User';
import AccountSettings from './AccountSettings';
import StreamSettings from './StreamSettings';
import './Settings.css';

const Settings = () => {
  const { userData } = useUser();

  return (
    userData && (
      <article className="settings-container">
        <h2>{$content.settings_page.title}</h2>
        <StreamSettings />
        <AccountSettings />
      </article>
    )
  );
};

export default Settings;
