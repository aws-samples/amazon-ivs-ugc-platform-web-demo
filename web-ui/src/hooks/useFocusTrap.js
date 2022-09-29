import { useEffect, useRef, useState, useCallback } from 'react';
import useMutationObserver from './useMutationObserver';

const focusableSelectors = 'a[href], button, textarea, input, select';

const useFocusTrap = (refs, isEnabled = true) => {
  const [elements, setElements] = useState([]);
  const targetRefs = useRef(refs);

  const updateFocusElements = useCallback(() => {
    if (!isEnabled) return;

    const nodesToFocus = targetRefs.current.reduce(
      (nodes, { current: targetEl }) => {
        if (targetEl) {
          const nodeList = targetEl.querySelectorAll(focusableSelectors);
          nodes.push(...nodeList);
        }
        return nodes;
      },
      []
    );

    setElements(Array.from(nodesToFocus));

    return () => setElements([]);
  }, [isEnabled]);

  useMutationObserver(targetRefs.current, updateFocusElements);

  useEffect(() => {
    updateFocusElements();
  }, [updateFocusElements]);

  useEffect(() => {
    // Focus trap to constrain the tab focus to elements within the target container
    const handleTabKey = (event) => {
      if (event.keyCode !== 9) return;

      const focusableElements = elements.filter(
        (el) => !el.hidden && !el.disabled
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const hasElementFocus = focusableElements.includes(
        document.activeElement
      );

      if (
        event.shiftKey &&
        (!hasElementFocus || document.activeElement === firstElement)
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (!hasElementFocus || document.activeElement === lastElement)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    if (isEnabled && elements.length) {
      document.addEventListener('keydown', handleTabKey);

      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [elements, isEnabled]);
};

export default useFocusTrap;
