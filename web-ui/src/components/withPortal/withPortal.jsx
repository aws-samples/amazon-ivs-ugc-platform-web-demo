import { createPortal } from 'react-dom';
import { forwardRef, useLayoutEffect, useRef } from 'react';

import { boundContainerWithinViewport } from './utils';

const initContainer = (containerId, parentEl = document.body) => {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
  }
  container.setAttribute('id', containerId);
  parentEl.appendChild(container);

  return container;
};

const withPortal = (
  WrappedComponent,
  containerId,
  { keepInViewport = false } = {}
) =>
  // eslint-disable-next-line react/prop-types
  forwardRef(({ isOpen, parentEl, ...props }, ref) => {
    const id = useRef(`${containerId}-container`);
    const container = isOpen ? initContainer(id.current, parentEl) : null;

    useLayoutEffect(() => {
      if (keepInViewport) {
        boundContainerWithinViewport(container);
      }

      return () => container?.remove();
    }, [container, parentEl]);

    return (
      container &&
      createPortal(<WrappedComponent ref={ref} {...props} />, container)
    );
  });

export default withPortal;
