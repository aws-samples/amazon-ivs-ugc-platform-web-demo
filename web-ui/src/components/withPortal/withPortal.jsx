import { createPortal } from 'react-dom';
import {
  memo,
  useLayoutEffect,
  useRef,
  forwardRef,
  useEffect,
  useMemo,
  useState
} from 'react';

import { clsm } from '../../utils';

const DEFAULT_PORTAL_OPTIONS = {
  isAnimated: false,
  animationDuration: 250,
  baseContainerClasses: []
};

/**
 * Creates and/or returns the container to attach the portal to.
 *
 * When prevSiblingEl is provided, the portal is rendered immediately
 * after it in the DOM tree.
 *  - note that prevSiblingEl takes precedence over parentEl
 */
const initContainer = ({
  containerClassname = '',
  containerId,
  parentEl = document.body,
  prevSiblingEl
}) => {
  let container = document.getElementById(containerId);
  const containerParentEl = container?.parentElement;

  if (containerParentEl && containerParentEl !== parentEl) {
    container.remove();
    container = null;
  }

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
    animationDuration,
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
        const [animatedContainer, setAnimatedContainer] = useState(null);

        const memoizedContainer = useMemo(() => {
          return isOpen
            ? initContainer({
                containerClassname: clsm(
                  baseContainerClasses,
                  containerClasses
                ),
                containerId: id.current,
                parentEl,
                prevSiblingEl
              })
            : null;
        }, [containerClasses, isOpen, parentEl, prevSiblingEl]);

        const container = useMemo(
          () => (isAnimated ? animatedContainer : memoizedContainer),
          [animatedContainer, memoizedContainer]
        );

        useEffect(() => {
          let timeoutId;

          if (isOpen) {
            setAnimatedContainer(memoizedContainer);
          } else {
            timeoutId = setTimeout(() => {
              setAnimatedContainer(null);
            }, animationDuration);
          }

          return () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          };
        }, [
          memoizedContainer,
          isOpen,
          containerClasses,
          parentEl,
          prevSiblingEl
        ]);

        useLayoutEffect(() => {
          if (position && container) {
            for (const attr in position) {
              const val = position[attr];
              if (val) container.style[attr] = `${val}px`;
            }
          }
        }, [container, parentEl, position, prevSiblingEl]);

        useEffect(() => {
          if (!isAnimated || containerId === 'modal') {
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
