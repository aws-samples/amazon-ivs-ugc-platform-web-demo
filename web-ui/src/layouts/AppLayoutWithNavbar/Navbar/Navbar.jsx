import { useMobileBreakpoint } from '../../../contexts/MobileBreakpoint';
import MobileNavbar from './MobileNavbar';
import Sidebar from './Sidebar';

const Navbar = () => {
  const { isDefaultResponsiveView, isLandscape, isTouchscreenDevice } =
    useMobileBreakpoint();

  return isDefaultResponsiveView || (isLandscape && isTouchscreenDevice) ? (
    <MobileNavbar />
  ) : (
    <Sidebar />
  );
};

export default Navbar;
