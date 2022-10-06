import { createPortal } from 'react-dom';
import { memo, useLayoutEffect, useRef, forwardRef, useEffect } from 'react';

import { clsm } from '../../utils';

const DEFAULT_PORTAL_OPTIONS = {
  isAnimated: false,
  baseContainerClasses: []
};

/**
 * Creates and/or returns the container to attach the portal to.
 * When provided, `prevSiblingEl` takes precedence over `parentEl`.
 */
const initContainer = ({
  containerClassname = '',
  containerId,
  parentEl = document.body,
  prevSiblingEl
}) => {
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.setAttribute('id', containerId);
    if (containerClassname) container.setAttribute('class', containerClassname);

    if (prevSiblingEl) prevSiblingEl.after(container);
    else parentEl.appendChild(container);
  } else if (containerClassname) {
    // If the container already exists, update the classnames as they can be passed as props
    container.setAttribute('class', containerClassname);
  }

  return container;
};

const withPortal = (
  WrappedComponent,
  containerId,
  {
    isAnimated = DEFAULT_PORTAL_OPTIONS.isAnimated,
    baseContainerClasses = DEFAULT_PORTAL_OPTIONS.baseContainerClasses
  } = DEFAULT_PORTAL_OPTIONS
) =>
  memo(
    // eslint-disable-next-line react/prop-types
    forwardRef(
      (
        {
          containerClasses,
          isOpen,
          parentEl,
          prevSiblingEl,
          position,
          ...props
        },
        ref
      ) => {
        const id = useRef(`${containerId}-container`);
        const container = isOpen
          ? initContainer({
              containerClassname: clsm(baseContainerClasses, containerClasses),
              containerId: id.current,
              parentEl,
              prevSiblingEl
            })
          : null;

        useLayoutEffect(() => {
          if (position && container) {
            for (const attr in position) {
              const val = position[attr];
              if (val) container.style[attr] = `${val}px`;
            }
          }
        }, [container, parentEl, position, prevSiblingEl]);

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
      }
    )
  );

export default withPortal;
