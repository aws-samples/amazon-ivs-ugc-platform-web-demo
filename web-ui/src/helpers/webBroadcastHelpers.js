export const fitRectIntoContainer = (
  rectWidth,
  rectHeight,
  containerWidth,
  containerHeight
) => {
  const widthRatio = containerWidth / rectWidth; // ration container width to rect width
  const heightRatio = containerHeight / rectHeight; // ration container height to rect height

  const ratio = Math.min(widthRatio, heightRatio); // take the smaller ratio

  // new rect width and height, scaled by the same ratio
  return { width: rectWidth * ratio, height: rectHeight * ratio };
};
