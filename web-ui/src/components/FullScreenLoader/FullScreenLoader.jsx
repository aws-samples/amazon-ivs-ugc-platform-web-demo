import PropTypes from 'prop-types';

import './FullScreenLoader.css';
import { app as $content } from '../../content';
import { SyncError } from '../../assets/icons';
import Button from '../Button';
import Spinner from '../Spinner';

const noop = () => {};

const FullScreenLoader = ({ hasError, onClick }) =>
  hasError ? (
    <div className="error-message">
      <SyncError />
      <h2>{$content.full_screen_loader.error_occurred}</h2>
      <Button
        customStyles={{ color: 'var(--color-blue)' }}
        onClick={onClick}
        variant="link"
      >
        {$content.full_screen_loader.try_again}
      </Button>
    </div>
  ) : (
    <div className="loading-container">
      <Spinner size="medium" variant="light" />
    </div>
  );

FullScreenLoader.propTypes = {
  hasError: PropTypes.bool,
  onClick: PropTypes.func
};

FullScreenLoader.defaultProps = {
  hasError: false,
  onClick: noop
};

export default FullScreenLoader;
