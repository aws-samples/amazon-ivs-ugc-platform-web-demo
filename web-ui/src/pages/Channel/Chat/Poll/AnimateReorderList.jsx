import React, { useState, useLayoutEffect, useEffect } from 'react';

import { usePoll } from '../../../../contexts/StreamManagerActions/Poll';
import usePrevious from '../../../../hooks/usePrevious';
import { SHOW_POLL_RESULTS_ANIMATION_DURATION } from '../../../../constants';

export const calculateBoundingBoxes = (children) => {
  const boundingBoxes = {};

  React.Children.forEach(children, (child) => {
    const domNode = child?.ref?.current;
    const nodeBoundingBox = domNode?.getBoundingClientRect();

    boundingBoxes[child.key] = nodeBoundingBox;
  });

  return boundingBoxes;
};

const AnimateReorderList = ({ children }) => {
  const [boundingBox, setBoundingBox] = useState({});
  const [prevBoundingBox, setPrevBoundingBox] = useState({});
  const prevChildren = usePrevious(children);
  const { showFinalResults, shouldAnimateListRef } = usePoll();

  useLayoutEffect(() => {
    const newBoundingBox = calculateBoundingBoxes(children);
    setBoundingBox(newBoundingBox);
  }, [children]);

  useLayoutEffect(() => {
    const prevBoundingBox = calculateBoundingBoxes(prevChildren);
    setPrevBoundingBox(prevBoundingBox);
  }, [prevChildren]);

  useEffect(() => {
    const hasPrevBoundingBox = Object.keys(prevBoundingBox).length;

    if (hasPrevBoundingBox) {
      React.Children.forEach(children, (child) => {
        const firstBox = prevBoundingBox[child.key];

        const lastBox = boundingBox[child.key];
        const changeInYAxis = firstBox?.y - lastBox?.y;

        const domNode = child?.ref?.current;

        if (
          !shouldAnimateListRef?.current &&
          changeInYAxis &&
          changeInYAxis !== 0 &&
          showFinalResults
        ) {
          requestAnimationFrame(() => {
            shouldAnimateListRef.current = true;
            // Before the DOM paints, invert child to old position
            domNode.style.transform = `translateY(${changeInYAxis}px)`;
            domNode.style.transition = 'transform 0s';

            requestAnimationFrame(() => {
              // After the previous frame, remove the transistion to play the animation
              domNode.style.transform = '';
              domNode.style.transition = `transform ${SHOW_POLL_RESULTS_ANIMATION_DURATION}ms`;
            });
          });
        }
      });
    }
  }, [
    boundingBox,
    prevBoundingBox,
    children,
    showFinalResults,
    shouldAnimateListRef
  ]);

  return children;
};

export default AnimateReorderList;
