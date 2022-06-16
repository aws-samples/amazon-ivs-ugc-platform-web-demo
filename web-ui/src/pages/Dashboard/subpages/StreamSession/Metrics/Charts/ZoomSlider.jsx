import { useCallback } from 'react';
import PropTypes from 'prop-types';
import SliderUnstyled from '@mui/base/SliderUnstyled';

const minDistance = 5;

const ZoomSlider = ({ dataLength, setZoomBounds, zoomBounds }) => {
  const [lowerBound, upperBound] = zoomBounds;

  const zoomBoundToPercentage = useCallback(
    (val) => parseFloat(((val / dataLength) * 100).toFixed(1)),
    [dataLength]
  );
  const percentageToZoomBound = useCallback(
    (percentage) => Math.round(dataLength * percentage) / 100,
    [dataLength]
  );

  const handleChange = useCallback(
    (event, newValues, activeThumb) => {
      if (activeThumb === 0) {
        setZoomBounds((prevValues) => {
          const [newLowerPercentage] = newValues;
          const newLowerBound = percentageToZoomBound(newLowerPercentage);

          if (newLowerBound !== prevValues[0])
            return [
              Math.min(
                newLowerBound,
                prevValues[1] - percentageToZoomBound(minDistance)
              ),
              prevValues[1]
            ];

          return prevValues;
        });
      } else {
        setZoomBounds((prevValues) => {
          const [, newUpperPercentage] = newValues;
          const newUpperBound = percentageToZoomBound(newUpperPercentage);

          if (newUpperBound !== prevValues[1])
            return [
              prevValues[0],
              Math.max(
                newUpperBound,
                prevValues[0] + percentageToZoomBound(minDistance)
              )
            ];

          return prevValues;
        });
      }
    },
    [percentageToZoomBound, setZoomBounds]
  );

  const mouseDownRailHandler = useCallback((event) => {
    event.stopPropagation();
  }, []);

  return (
    <SliderUnstyled
      componentsProps={{ track: { onMouseDown: mouseDownRailHandler } }}
      disableSwap
      max={100}
      min={0}
      onChange={handleChange}
      step={0.1}
      track="inverted"
      value={[
        zoomBoundToPercentage(lowerBound),
        zoomBoundToPercentage(upperBound)
      ]}
    />
  );
};

ZoomSlider.defaultProps = {
  dataLength: 0,
  zoomBounds: [0, 0]
};

ZoomSlider.propTypes = {
  dataLength: PropTypes.number,
  setZoomBounds: PropTypes.func.isRequired,
  zoomBounds: PropTypes.arrayOf(PropTypes.number)
};

export default ZoomSlider;
