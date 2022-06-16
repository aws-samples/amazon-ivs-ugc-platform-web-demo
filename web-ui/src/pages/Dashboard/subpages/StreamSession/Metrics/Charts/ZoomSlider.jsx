import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import SliderUnstyled from '@mui/base/SliderUnstyled';

import { bound } from '../../../../../../utils';
import { useEffect } from 'react';

const minDistance = 5;

const ZoomSlider = ({ dataLength, setZoomBounds, zoomBounds }) => {
  const [lowerBound, upperBound] = zoomBounds;
  const pointerDownClientX = useRef(null);
  const sliderRootRef = useRef();

  const zoomBoundToPercentage = useCallback(
    (val) => parseFloat(((val / dataLength) * 100).toFixed(1)),
    [dataLength]
  );
  const percentageToZoomBound = useCallback(
    (percentage) => Math.round((dataLength * percentage) / 100),
    [dataLength]
  );

  const handleChange = useCallback(
    (event, newValues, activeThumb) => {
      if (activeThumb === 0) {
        setZoomBounds((prevBounds) => {
          const [newLowerPercentage] = newValues;
          const newLowerBound = percentageToZoomBound(newLowerPercentage);

          if (newLowerBound !== prevBounds[0])
            return [
              Math.min(
                newLowerBound,
                prevBounds[1] - percentageToZoomBound(minDistance)
              ),
              prevBounds[1]
            ];

          return prevBounds;
        });
      } else {
        setZoomBounds((prevBounds) => {
          const [, newUpperPercentage] = newValues;
          const newUpperBound = percentageToZoomBound(newUpperPercentage);

          if (newUpperBound !== prevBounds[1])
            return [
              prevBounds[0],
              Math.max(
                newUpperBound,
                prevBounds[0] + percentageToZoomBound(minDistance)
              )
            ];

          return prevBounds;
        });
      }
    },
    [percentageToZoomBound, setZoomBounds]
  );

  const mouseDownTrackHandler = useCallback(
    (event) => event.stopPropagation(),
    []
  );
  const pointerDownTrackHandler = useCallback((event) => {
    event.stopPropagation();

    pointerDownClientX.current = event.clientX;
  }, []);
  const pointerUpTrackHandler = useCallback((event) => {
    event.stopPropagation();

    pointerDownClientX.current = null;
  }, []);
  const pointerMoveTrackHandler = useCallback(
    (event) => {
      event.stopPropagation();

      if (!pointerDownClientX.current) return;

      const percentageDiff = parseFloat(
        ((event.clientX / pointerDownClientX.current) * 100 - 100).toFixed(1)
      );

      setZoomBounds((prevBounds) => {
        const [prevLowerBound, prevUpperBound] = prevBounds;
        const newLowerBound = bound(
          percentageToZoomBound(
            zoomBoundToPercentage(prevLowerBound) + percentageDiff
          ),
          0
        );
        const newUpperBound = bound(
          percentageToZoomBound(
            zoomBoundToPercentage(prevUpperBound) + percentageDiff
          ),
          0,
          dataLength - 1
        );

        pointerDownClientX.current = event.clientX;

        if (
          prevLowerBound !== newLowerBound &&
          prevUpperBound !== newUpperBound
        ) {
          return [newLowerBound, newUpperBound];
        }

        return prevBounds;
      });
    },
    [dataLength, percentageToZoomBound, setZoomBounds, zoomBoundToPercentage]
  );

  useEffect(() => {
    document.addEventListener('pointermove', pointerMoveTrackHandler);
    document.addEventListener('pointerup', pointerUpTrackHandler);

    return () => {
      document.removeEventListener('pointermove', pointerMoveTrackHandler);
      document.removeEventListener('pointerup', pointerUpTrackHandler);
    };
  }, [pointerMoveTrackHandler, pointerUpTrackHandler]);

  return (
    <SliderUnstyled
      componentsProps={{
        track: {
          onMouseDown: mouseDownTrackHandler,
          onPointerDown: pointerDownTrackHandler
        }
      }}
      disableSwap
      max={100}
      min={0}
      onChange={handleChange}
      ref={sliderRootRef}
      step={0.1}
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
