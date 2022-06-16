import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import SliderUnstyled from '@mui/base/SliderUnstyled';

import { bound } from '../../../../../../utils';
import { useEffect } from 'react';

const minDistance = 50;
const maxValue = 1000;

const ZoomSlider = ({ chartsRef, dataLength, setZoomBounds, zoomBounds }) => {
  const [lowerBound, upperBound] = zoomBounds;
  const pointerDownEventData = useRef(null);
  const sliderRootRef = useRef();

  const zoomBoundToPercentage = useCallback(
    (val) => Math.round((val / dataLength) * maxValue),
    [dataLength]
  );
  const percentageToZoomBound = useCallback(
    (percentage) => Math.round((dataLength * percentage) / maxValue),
    [dataLength]
  );

  const handleChange = useCallback(
    (event, newValues, activeThumb) => {
      if (activeThumb === 0) {
        setZoomBounds((prevZoomBounds) => {
          const [newLowerPercentage] = newValues;
          const newLowerBound = percentageToZoomBound(newLowerPercentage);

          if (newLowerBound !== prevZoomBounds[0])
            return [
              Math.min(
                newLowerBound,
                prevZoomBounds[1] - percentageToZoomBound(minDistance)
              ),
              prevZoomBounds[1]
            ];

          return prevZoomBounds;
        });
      } else {
        setZoomBounds((prevZoomBounds) => {
          const [, newUpperPercentage] = newValues;
          const newUpperBound = percentageToZoomBound(newUpperPercentage);

          if (newUpperBound !== prevZoomBounds[1])
            return [
              prevZoomBounds[0],
              Math.max(
                newUpperBound,
                prevZoomBounds[0] + percentageToZoomBound(minDistance)
              )
            ];

          return prevZoomBounds;
        });
      }
    },
    [percentageToZoomBound, setZoomBounds]
  );

  const mouseDownTrackHandler = useCallback(
    (event) => event.stopPropagation(),
    []
  );
  const pointerDownTrackHandler = useCallback(
    (event) => {
      event.stopPropagation();

      pointerDownEventData.current = { clientX: event.clientX, zoomBounds };
    },
    [zoomBounds]
  );
  const pointerUpTrackHandler = useCallback((event) => {
    event.stopPropagation();

    pointerDownEventData.current = null;
  }, []);
  const pointerMoveTrackHandler = useCallback(
    (event) => {
      event.stopPropagation();

      if (!pointerDownEventData.current) return;

      const { clientX: originClientX, zoomBounds: originZoomBounds } =
        pointerDownEventData.current;
      const zoomBoundsDiff = percentageToZoomBound(
        ((event.clientX - originClientX) / originClientX) * maxValue
      );

      setZoomBounds((prevZoomBounds) => {
        const [originLowerZoomBound, originUpperZoomBound] = originZoomBounds;
        const originDiff = originUpperZoomBound - originLowerZoomBound;
        const [prevLowerZoomBound, prevUpperZoomBound] = prevZoomBounds;
        const newLowerBound = bound(
          originLowerZoomBound + zoomBoundsDiff,
          0,
          dataLength - 1 - originDiff
        );
        const newUpperBound = bound(
          originUpperZoomBound + zoomBoundsDiff,
          newLowerBound + originDiff,
          dataLength - 1
        );

        if (
          prevLowerZoomBound !== newLowerBound &&
          prevUpperZoomBound !== newUpperBound
        ) {
          return [newLowerBound, newUpperBound];
        }

        return prevZoomBounds;
      });
    },
    [dataLength, percentageToZoomBound, setZoomBounds]
  );

  useEffect(() => {
    const chartsElement = chartsRef.current;

    if (chartsElement) {
      chartsElement.addEventListener('pointermove', pointerMoveTrackHandler);
      document.addEventListener('pointerup', pointerUpTrackHandler);

      return () => {
        chartsElement.removeEventListener(
          'pointermove',
          pointerMoveTrackHandler
        );
        document.removeEventListener('pointerup', pointerUpTrackHandler);
      };
    }
  }, [chartsRef, pointerMoveTrackHandler, pointerUpTrackHandler]);

  return (
    <SliderUnstyled
      componentsProps={{
        rail: { onMouseDown: mouseDownTrackHandler },
        track: {
          onMouseDown: mouseDownTrackHandler,
          onPointerDown: pointerDownTrackHandler
        }
      }}
      disableSwap
      max={maxValue}
      min={0}
      onChange={handleChange}
      ref={sliderRootRef}
      value={[
        zoomBoundToPercentage(lowerBound),
        zoomBoundToPercentage(upperBound)
      ]}
    />
  );
};

ZoomSlider.defaultProps = {
  chartsRef: { current: null },
  dataLength: 0,
  zoomBounds: [0, 0]
};

ZoomSlider.propTypes = {
  chartsRef: PropTypes.object,
  dataLength: PropTypes.number,
  setZoomBounds: PropTypes.func.isRequired,
  zoomBounds: PropTypes.arrayOf(PropTypes.number)
};

export default ZoomSlider;
