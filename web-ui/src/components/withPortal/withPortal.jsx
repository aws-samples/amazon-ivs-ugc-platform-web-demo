import { createPortal } from 'react-dom';
import { memo, useLayoutEffect, useRef, forwardRef, useEffect } from 'react';

import useFirstMountState from '../../hooks/useFirstMountState';

const initContainer = (containerId, parentEl = document.body) => {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
  }
  container.setAttribute('id', containerId);
  parentEl.appendChild(container);

  return container;
};

const withPortal = (WrappedComponent, containerId) =>
  memo(
    forwardRef(({ isOpen, parentEl, position, ...props }, ref) => {
      const isFirstMount = useFirstMountState();
      const id = useRef(`${containerId}-container`);
      const container = isOpen ? initContainer(id.current, parentEl) : null;

      useLayoutEffect(() => {
        if (position && container) {
          for (const attr in position) {
            const val = position[attr];
            if (val) container.style[attr] = `${val}px`;
          }
        }
      }, [container, parentEl, position]);

      useEffect(() => {
        if (!isFirstMount) {
          return () => container?.remove();
        }
      }, [container, isFirstMount]);

      return (
        container &&
        createPortal(<WrappedComponent ref={ref} {...props} />, container)
      );
    })
  );

export default withPortal;
