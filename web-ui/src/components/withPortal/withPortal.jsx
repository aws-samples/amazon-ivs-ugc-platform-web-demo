import { createPortal } from 'react-dom';
import { memo, useLayoutEffect, useRef, forwardRef, useEffect } from 'react';

import { clsm } from '../../utils';

const DEFAULT_PORTAL_OPTIONS = {
  isAnimated: false,
  containerClasses: []
};

const initContainer = (
  containerId,
  parentEl = document.body,
  containerClassname = ''
) => {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    if (containerClassname) container.setAttribute('class', containerClassname);
    parentEl.appendChild(container);
  }

  return container;
};

const withPortal = (
  WrappedComponent,
  containerId,
  {
    isAnimated = DEFAULT_PORTAL_OPTIONS.isAnimated,
    containerClasses = DEFAULT_PORTAL_OPTIONS.containerClasses
  } = DEFAULT_PORTAL_OPTIONS
) =>
  memo(
    // eslint-disable-next-line react/prop-types
    forwardRef(({ isOpen, parentEl, position, ...props }, ref) => {
      const id = useRef(`${containerId}-container`);
      const container = isOpen
        ? initContainer(id.current, parentEl, clsm(containerClasses))
        : null;

      useLayoutEffect(() => {
        if (position && container) {
          for (const attr in position) {
            const val = position[attr];
            if (val) container.style[attr] = `${val}px`;
          }
        }
      }, [container, parentEl, position]);

      useEffect(() => {
        if (!isAnimated) {
          return () => container?.remove();
        }
      }, [container]);

      return (
        container &&
        createPortal(
          <WrappedComponent isOpen={isOpen} ref={ref} {...props} />,
          container
        )
      );
    })
  );

export default withPortal;
