import { BREAKPOINTS } from '../../constants';
import { useUser } from '../../contexts/User';
import FullScreenLoader from '../FullScreenLoader';

const withSessionLoader =
  (WrappedComponent, mobileBreakpoint = BREAKPOINTS.md) =>
  (props) => {
    const { isSessionValid } = useUser();

    // If isSessionValid is undefined, then we are still validating the current session, if one exists
    return isSessionValid === undefined ? (
      <FullScreenLoader mobileBreakpoint={mobileBreakpoint} />
    ) : (
      <WrappedComponent {...props} />
    );
  };

export default withSessionLoader;
