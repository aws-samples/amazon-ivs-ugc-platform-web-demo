import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import MobileNavbar from './MobileNavbar';
import Sidebar from './Sidebar';
import useCurrentPage from '../../../hooks/useCurrentPage';

const Navbar = () => {
  const { isMobileView } = useMobileBreakpoint();
  const currentPage = useCurrentPage();
  const isChannelPage = currentPage === 'channel';

  if (isMobileView) {
    return isChannelPage ? null : <MobileNavbar />;
  }

  return <Sidebar />;
};

export default Navbar;
