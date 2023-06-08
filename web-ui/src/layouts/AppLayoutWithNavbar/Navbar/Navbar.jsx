import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import MobileNavbar from './MobileNavbar';
import Sidebar from './Sidebar';
import useCurrentPage from '../../../hooks/useCurrentPage';

const Navbar = () => {
  const { isMobileView } = useResponsiveDevice();
  const currentPage = useCurrentPage();
  const isChannelPage = currentPage === 'channel';

  if (isMobileView) {
    return isChannelPage ? null : <MobileNavbar />;
  }

  return <Sidebar />;
};

export default Navbar;
