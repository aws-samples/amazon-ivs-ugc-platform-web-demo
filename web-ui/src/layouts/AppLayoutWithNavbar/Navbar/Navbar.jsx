import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import MobileNavbar from './MobileNavbar';
import Sidebar from './Sidebar';

const Navbar = () => {
  const { isMobileView } = useMobileBreakpoint();

  return isMobileView ? <MobileNavbar /> : <Sidebar />;
};

export default Navbar;
