import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import MobileNavbar from './MobileNavbar';
import Sidebar from './Sidebar';
import './Navbar.css';

const Navbar = () => {
  const { isDefaultResponsiveView, isMobileLandscape } = useMobileBreakpoint();

  return isDefaultResponsiveView || isMobileLandscape ? (
    <MobileNavbar />
  ) : (
    <Sidebar />
  );
};

export default Navbar;
