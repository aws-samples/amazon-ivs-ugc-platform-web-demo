import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import SliderUnstyled from '@mui/base/SliderUnstyled';

import { bound } from '../../../../../../utils';
import { useEffect } from 'react';

const minDistance = 6;
const maxValue = 1000;

const ZoomSlider = ({
  chartsRef,
  dataLength,
  isEnabled,
  setZoomBounds,
  zoomBounds
}) => {
  const [lowerBound, upperBound] = zoomBounds;
  const pointerDownEventData = useRef(null);
  const sliderRootRef = useRef();

  const zoomBoundToProportion = useCallback(
    (val) => (val / (dataLength - 1)) * maxValue,
    [dataLength]
  );
  const proportionToZoomBound = useCallback(
    (proportion) => (proportion / maxValue) * (dataLength - 1),
    [dataLength]
  );

  const handleChange = useCallback(
    (event, newValues, activeThumb) => {
      if (activeThumb === 0) {
        setZoomBounds((prevZoomBounds) => {
          const [newLowerProportion] = newValues;
          const newLowerBound = proportionToZoomBound(newLowerProportion);

          if (newLowerBound !== prevZoomBounds[0])
            return [
              Math.min(newLowerBound, prevZoomBounds[1] - minDistance),
              prevZoomBounds[1]
            ];

          return prevZoomBounds;
        });
      } else {
        setZoomBounds((prevZoomBounds) => {
          const [, newUpperProportion] = newValues;
          const newUpperBound = proportionToZoomBound(newUpperProportion);

          if (newUpperBound !== prevZoomBounds[1])
            return [
              prevZoomBounds[0],
              Math.min(
                Math.max(newUpperBound, prevZoomBounds[0] + minDistance),
                dataLength - 1
              )
            ];

          return prevZoomBounds;
        });
      }
    },
    [dataLength, proportionToZoomBound, setZoomBounds]
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
      const zoomBoundsDiff = proportionToZoomBound(
        ((event.clientX - originClientX) /
          (sliderRootRef.current.clientWidth + 20)) *
          maxValue
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
    [dataLength, proportionToZoomBound, setZoomBounds]
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
        rail: {
          onMouseDown: mouseDownTrackHandler
        },
        track: {
          onMouseDown: mouseDownTrackHandler,
          onPointerDown: pointerDownTrackHandler
        },
        thumb: {
          onMouseEnter: ({ target }) =>
            isEnabled && target.classList.add('hover'),
          onMouseOut: ({ target }) =>
            isEnabled && target.classList.remove('hover')
        }
      }}
      disableSwap
      disabled={!isEnabled}
      max={maxValue}
      min={0}
      onChange={handleChange}
      ref={sliderRootRef}
      value={
        isEnabled
          ? [
              zoomBoundToProportion(lowerBound),
              zoomBoundToProportion(upperBound)
            ]
          : [0, maxValue]
      }
    />
  );
};

ZoomSlider.defaultProps = {
  chartsRef: { current: null },
  dataLength: 0,
  isEnabled: false,
  zoomBounds: [0, 0]
};

ZoomSlider.propTypes = {
  chartsRef: PropTypes.object,
  dataLength: PropTypes.number,
  isEnabled: PropTypes.bool,
  setZoomBounds: PropTypes.func.isRequired,
  zoomBounds: PropTypes.arrayOf(PropTypes.number)
};

export default ZoomSlider;
