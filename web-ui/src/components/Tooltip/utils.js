export const keepWithinViewport = (offsets, tooltipEl) => {
  const boundOffsets = offsets;
  const { top, left } = offsets;
  const { innerWidth, innerHeight } = window;
  const { width: tooltipWidth, height: tooltipHeight } =
    tooltipEl.getBoundingClientRect();

  if (left < 0) {
    boundOffsets.left = 0;
  } else if (left + tooltipWidth > innerWidth) {
    boundOffsets.left = innerWidth - tooltipWidth;
  }

  if (top < 0) {
    boundOffsets.top = 0;
  } else if (top + tooltipHeight > innerHeight) {
    boundOffsets.top = innerHeight - tooltipHeight;
  }

  return boundOffsets;
};
