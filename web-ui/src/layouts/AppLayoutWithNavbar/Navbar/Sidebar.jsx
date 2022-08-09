import { AcmeSml, AcmeLrg } from '../../../assets/icons';
import { app as $appContent } from '../../../content';
import { Home, Feed } from '../../../assets/icons';
import { useUser } from '../../../contexts/User';
import * as avatars from '../../../assets/avatars';
import Button from '../../../components/Button';
import './Navbar.css';

const $content = $appContent.navbar;
const defaultNavButtonProps = (pageName) => ({
  ariaLabel: `Go to the ${pageName} page`,
  type: 'nav',
  variant: 'tertiaryText',
  customStyles: { minWidth: 'auto' }
});

const Sidebar = () => {
  const { isSessionValid, userData: { avatar: avatarName } = {} } = useUser();

  return (
    <nav className={`sidebar ${isSessionValid ? 'auth' : 'unauth'}`}>
      {isSessionValid ? (
        <>
          <AcmeSml className="fill-darkMode-gray-light" />
          <div className="sidebar-page-buttons">
            <Button {...defaultNavButtonProps('home')} to="/">
              <Home />
            </Button>
            <Button {...defaultNavButtonProps('feed')} to="/feed">
              <Feed />
            </Button>
          </div>
          {avatars[avatarName] ? (
            <img
              className="profile-avatar-menu"
              src={avatars[avatarName]}
              alt={`${avatarName} avatar`}
              draggable={false}
            />
          ) : (
            <span className="profile-avatar-menu" />
          )}
        </>
      ) : (
        <>
          <AcmeLrg className="fill-darkMode-gray-light min-w-[96px] w-[96px] min-h-[24px] h-[24px]" />
          <div className="sidebar-page-buttons">
            <Button {...defaultNavButtonProps('home')} to="/">
              <Home /> {$content.home}
            </Button>
            <Button {...defaultNavButtonProps('feed')} to="/feed">
              <Feed /> {$content.feed}
            </Button>
          </div>
          <div className="sidebar-user-buttons">
            <Button type="nav" variant="secondary" to="/login">
              {$content.log_in}
            </Button>
            <Button type="nav" variant="primary" to="/register">
              {$content.sign_up}
            </Button>
          </div>
        </>
      )}
    </nav>
  );
};

export default Sidebar;
