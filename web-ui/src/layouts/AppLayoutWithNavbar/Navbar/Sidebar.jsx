import { app as $appContent } from '../../../content';
import { AcmeSmall, AcmeLarge } from '../../../assets/icons';
import { useUser } from '../../../contexts/User';
import * as avatars from '../../../assets/avatars';
import LinkButton from '../../../components/LinkButton';
import './Navbar.css';

const $content = $appContent.navbar;

const Sidebar = () => {
  const { isSessionValid, userData: { avatar: avatarName } = {} } = useUser();

  return (
    <nav className={`sidebar ${isSessionValid ? '' : 'unauthenticated'}`}>
      {isSessionValid ? (
        // TEMPORARY
        <>
          <AcmeSmall />
          <div>
            <div>A</div>
            <div>B</div>
            <div>C</div>
          </div>
          <img
            className="profile-avatar-menu"
            src={avatars[avatarName]}
            alt={`${avatarName} Avatar`}
            draggable={false}
          />
        </>
      ) : (
        <>
          <AcmeLarge />
          <div className="user-mgmt-link-buttons">
            <LinkButton to="/login" variant="secondary">
              {$content.log_in}
            </LinkButton>
            <LinkButton to="/register" variant="primary">
              {$content.sign_up}
            </LinkButton>
          </div>
        </>
      )}
    </nav>
  );
};

export default Sidebar;
