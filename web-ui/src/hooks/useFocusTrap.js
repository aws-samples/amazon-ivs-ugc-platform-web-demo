import { useEffect, useRef, useState, useCallback } from 'react';
import useMutationObserver from './useMutationObserver';

const focusableSelectors = 'a[href], button, textarea, input, select';

const useFocusTrap = (refs, isEnabled = true, focusTrapConfigs = {}) => {
  const [elementLists, setElementLists] = useState([]);
  const targetRefs = useRef(refs);

  /**
   * Updates the lists of elements based on the provided targetRefs
   * @returns {Element[][]}
   */
  const updateFocusElements = useCallback(() => {
    if (!isEnabled) return;

    const nodesToFocus = targetRefs.current.reduce(
      (nodes, { current: targetEl }) => {
        if (targetEl) {
          const nodeList = targetEl.querySelectorAll(focusableSelectors);

          return [...nodes, Array.from(nodeList)];
        }

        return nodes;
      },
      []
    );

    setElementLists(nodesToFocus);

    return () => setElementLists([]);
  }, [isEnabled]);

  useMutationObserver(targetRefs.current, updateFocusElements);

  useEffect(() => {
    updateFocusElements();
  }, [updateFocusElements]);

  useEffect(() => {
    /**
     * Focus trap to constrain the tab focus to elements within the target container.
     * The trap also handles focus between refs that aren't siblings in the DOM.
     */
    const handleTabKey = (event) => {
      if (event.keyCode !== 9) return;
      const { shouldReFocusBackOnLastClickedItem = undefined } =
        focusTrapConfigs;

      const focusableElements = elementLists.map((elementList) =>
        elementList.filter((element) => !element.hidden && !element.disabled)
      );
      const currentElementListIndex = focusableElements.findIndex(
        (elementList) => elementList.includes(document.activeElement)
      );

      const currentElementList =
        focusableElements[currentElementListIndex] || focusableElements[0];
      const shouldFocusBackOnLastClickedItem =
        shouldReFocusBackOnLastClickedItem &&
        document.activeElement === document.body;
      const hasElementFocus = currentElementListIndex > -1;
      let nextElementToFocus;

      if (shouldFocusBackOnLastClickedItem) return;

      if (event.shiftKey) {
        const lastElementListIndex = focusableElements.length - 1;
        const currentListFirstElement = currentElementList[0];

        if (!hasElementFocus) {
          const lastElementList = focusableElements[lastElementListIndex];

          nextElementToFocus = lastElementList[lastElementList.length - 1];
        } else if (document.activeElement === currentListFirstElement) {
          const nextElementListIndex =
            currentElementListIndex === 0
              ? lastElementListIndex
              : currentElementListIndex - 1;
          const nextElementList = focusableElements[nextElementListIndex];

          nextElementToFocus = nextElementList[nextElementList.length - 1];
        }
      } else {
        const currentListLastElement =
          currentElementList[currentElementList.length - 1];

        if (!hasElementFocus) {
          const firstElementList = focusableElements[0];

          nextElementToFocus = firstElementList[0];
        } else if (document.activeElement === currentListLastElement) {
          const nextElementListIndex =
            currentElementListIndex === focusableElements.length - 1
              ? 0
              : currentElementListIndex + 1;
          const nextElementList = focusableElements[nextElementListIndex];

          nextElementToFocus = nextElementList[0];
        }
      }

      if (nextElementToFocus) {
        event.preventDefault();
        nextElementToFocus.focus();
      }
    };

    if (isEnabled && elementLists.length) {
      document.addEventListener('keydown', handleTabKey);

      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [elementLists, focusTrapConfigs, isEnabled]);
};

export default useFocusTrap;
