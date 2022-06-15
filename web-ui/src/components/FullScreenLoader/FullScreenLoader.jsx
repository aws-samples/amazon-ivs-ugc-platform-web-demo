import PropTypes from 'prop-types';

import './FullScreenLoader.css';
import { app as $content } from '../../content';
import { BREAKPOINTS } from '../../constants';
import { SyncError } from '../../assets/icons';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import Button from '../Button';
import Spinner from '../Spinner';
import { useRef } from 'react';

const noop = () => {};

const FullScreenLoader = ({ hasError, mobileBreakpoint, onClick }) => {
  const { currentBreakpoint } = useMobileBreakpoint();
  const isResponsiveView = currentBreakpoint < mobileBreakpoint;
  const loadingContainerRef = useRef();
  let loadingContainerResponsiveStyle = isResponsiveView
    ? { height: '100%' }
    : {};

  if (
    isResponsiveView &&
    loadingContainerRef?.current?.parentNode?.id === 'root'
  ) {
    loadingContainerResponsiveStyle = { height: '100vh' };
  }

  return hasError ? (
    <div className="full-screen-loader-error">
      <SyncError />
      <h2>{$content.full_screen_loader.error_occurred}</h2>
      <Button
        customStyles={{ color: 'var(--palette-color-blue)' }}
        onClick={onClick}
        variant="link"
      >
        {$content.full_screen_loader.try_again}
      </Button>
    </div>
  ) : (
    <div
      className="loading-container"
      ref={loadingContainerRef}
      style={loadingContainerResponsiveStyle}
    >
      <Spinner size="large" variant="light" />
    </div>
  );
};

FullScreenLoader.propTypes = {
  hasError: PropTypes.bool,
  mobileBreakpoint: PropTypes.oneOf(Object.values(BREAKPOINTS)),
  onClick: PropTypes.func
};

FullScreenLoader.defaultProps = {
  hasError: false,
  mobileBreakpoint: BREAKPOINTS.md,
  onClick: noop
};

export default FullScreenLoader;
