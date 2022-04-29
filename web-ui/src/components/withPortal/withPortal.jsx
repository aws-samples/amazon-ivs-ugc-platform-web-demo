import { createPortal } from 'react-dom';
import { useEffect } from 'react';

const initContainer = (containerId) => {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    document.body.appendChild(container);
  }

  return container;
};

const withPortal =
  (WrappedComponent, containerId) =>
  ({ isOpen, ...props }) => {
    const container = isOpen ? initContainer(`${containerId}-container`) : null;

    useEffect(() => {
      return () => {
        container?.parentNode?.removeChild(container);
      };
    }, [container]);

    return (
      container && createPortal(<WrappedComponent {...props} />, container)
    );
  };

export default withPortal;
