import { useUser } from '../../contexts/User';
import FullScreenLoader from '../FullScreenLoader';

const withSessionLoader = (WrappedComponent) => (props) => {
  const { isSessionValid } = useUser();

  // If isSessionValid is undefined, then we are still validating the current session, if one exists
  return isSessionValid === undefined ? (
    <FullScreenLoader />
  ) : (
    <WrappedComponent {...props} />
  );
};

export default withSessionLoader;
