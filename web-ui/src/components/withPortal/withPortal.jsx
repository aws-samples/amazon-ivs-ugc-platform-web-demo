import { createPortal } from 'react-dom';
import { memo, useLayoutEffect, useRef, forwardRef, useEffect } from 'react';
import { clsm } from '../../utils';

const initContainer = (
  containerId,
  parentEl = document.body,
  classesString
) => {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    !!classesString && container.setAttribute('class', classesString);
    parentEl.appendChild(container);
  }

  return container;
};

const withPortal = (
  WrappedComponent,
  containerId,
  isAnimated = false,
  classes = ''
) =>
  memo(
    // eslint-disable-next-line react/prop-types
    forwardRef(({ isOpen, parentEl, position, ...props }, ref) => {
      const id = useRef(`${containerId}-container`);
      const container = isOpen
        ? initContainer(id.current, parentEl, clsm(classes))
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
        createPortal(<WrappedComponent ref={ref} {...props} />, container)
      );
    })
  );

export default withPortal;
