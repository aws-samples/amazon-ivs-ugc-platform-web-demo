import { useEffect, useRef, useState } from 'react';

const focusableSelectors = 'a[href], button, textarea, input, select';

const useFocusTrap = (refs, isEnabled) => {
  const [elements, setElements] = useState([]);
  const currIndex = useRef(null);
  const targetRefs = useRef(refs);

  useEffect(() => {
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

  useEffect(() => {
    // Focus trap to constrain the tab focus to elements within the target container
    const handleTabKey = (event) => {
      if (event.keyCode !== 9) return;

      const focusableElements = elements.filter(
        (el) => !el.hidden && !el.disabled
      );

      let nextIndex;
      if (currIndex.current === -1) {
        // Setting the starting index
        nextIndex = event.shiftKey ? -1 : 0;
      } else {
        nextIndex = event.shiftKey
          ? currIndex.current - 1
          : currIndex.current + 1;
      }

      const n = focusableElements.length;
      const nextIndexBounded = ((nextIndex % n) + n) % n;
      const elementToFocus = focusableElements[nextIndexBounded];

      currIndex.current = nextIndexBounded;

      if (document.activeElement !== elementToFocus) {
        event.preventDefault();
        elementToFocus.focus();
      }
    };

    if (isEnabled && elements.length) {
      currIndex.current = elements.findIndex(
        (el) => el === document.activeElement
      );

      document.addEventListener('keydown', handleTabKey);
    }

    return () => document.removeEventListener('keydown', handleTabKey);
  }, [elements, isEnabled]);
};

export default useFocusTrap;
