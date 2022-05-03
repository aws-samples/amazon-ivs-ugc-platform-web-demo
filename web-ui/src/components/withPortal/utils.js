export const boundContainerWithinViewport = (container) => {
  if (container) {
    const { innerWidth, innerHeight } = window;
    const { top, right, bottom, left } = container.getBoundingClientRect();
    let xOffset = 0;
    let yOffset = 0;

    if (right > innerWidth) xOffset = innerWidth - right;

    if (left < 0) xOffset = -left;

    if (bottom > innerHeight) yOffset = innerHeight - bottom;

    if (top < 0) yOffset = -top;

    container.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
  }
};
