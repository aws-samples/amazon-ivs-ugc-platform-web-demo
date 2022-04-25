import { useUser } from '../../contexts/User';
import Spinner from '../Spinner';
import './withSessionLoader.css';

const withSessionLoader = (WrappedComponent) => (props) => {
  const { isSessionValid } = useUser();

  // If isSessionValid is undefined, then we are still validating the current session, if one exists
  return isSessionValid === undefined ? (
    <div className="loading-container">
      <Spinner size="medium" variant="light" />
    </div>
  ) : (
    <WrappedComponent {...props} />
  );
};

export default withSessionLoader;
