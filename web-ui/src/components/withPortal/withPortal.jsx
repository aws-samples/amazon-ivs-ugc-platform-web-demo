import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef } from 'react';

import { boundContainerWithinViewport } from './utils';

const initContainer = (containerId, parentEl = document.body) => {
  let container = document.createElement('div');
  container.setAttribute('id', containerId);
  parentEl.appendChild(container);

  return container;
};

const withPortal =
  (WrappedComponent, containerId, { keepInViewport = false } = {}) =>
  ({ isOpen, parentEl, ...props }) => {
    const id = useRef(`${containerId}-container`);
    const container = isOpen ? initContainer(id.current, parentEl) : null;

    useLayoutEffect(() => {
      if (keepInViewport) {
        boundContainerWithinViewport(container);
      }

      return () => container?.remove();
    }, [container, parentEl]);

    return (
      container && createPortal(<WrappedComponent {...props} />, container)
    );
  };

export default withPortal;
