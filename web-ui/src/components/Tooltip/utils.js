export const keepWithinViewport = (offsets, tooltipEl) => {
  const boundOffsets = offsets;
  const { top, left } = offsets;
  const { innerWidth, innerHeight, scrollY } = window;
  const { width: tooltipWidth, height: tooltipHeight } =
    tooltipEl.getBoundingClientRect();

  if (left < 0) {
    boundOffsets.left = 0;
  } else if (left + tooltipWidth > innerWidth) {
    // Offset by an additional 15px to account for the scrollbar
    boundOffsets.left = innerWidth - tooltipWidth - 15;
  }

  if (top < 0) {
    boundOffsets.top = 0;
  } else if (top + tooltipHeight > innerHeight + scrollY) {
    boundOffsets.top = innerHeight - tooltipHeight;
  }

  return boundOffsets;
};
