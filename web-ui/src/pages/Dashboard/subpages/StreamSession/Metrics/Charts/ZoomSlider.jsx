import { useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import SliderUnstyled from '@mui/base/SliderUnstyled';

import {
  MIN_DISTANCE,
  ZOOM_LEVELS
} from '../../../../../../contexts/SynchronizedCharts';
import { bound } from '../../../../../../utils';

const maxValue = 1000;

const ZoomSlider = ({
  chartsRef,
  dataLength,
  isEnabled,
  setSelectedZoomLevel,
  setZoomBounds,
  zoomBounds
}) => {
  const [lowerBound, upperBound] = zoomBounds;
  const pointerDownEventData = useRef(null);
  const sliderRootRef = useRef();
  const trackRef = useRef();

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

          if (newLowerBound !== prevZoomBounds[0]) {
            setSelectedZoomLevel(ZOOM_LEVELS.NONE);

            return [
              Math.min(newLowerBound, prevZoomBounds[1] - MIN_DISTANCE),
              prevZoomBounds[1]
            ];
          }

          return prevZoomBounds;
        });
      } else {
        setZoomBounds((prevZoomBounds) => {
          const [, newUpperProportion] = newValues;
          const newUpperBound = proportionToZoomBound(newUpperProportion);

          if (newUpperBound !== prevZoomBounds[1]) {
            setSelectedZoomLevel(ZOOM_LEVELS.NONE);

            return [
              prevZoomBounds[0],
              Math.min(
                Math.max(newUpperBound, prevZoomBounds[0] + MIN_DISTANCE),
                dataLength - 1
              )
            ];
          }

          return prevZoomBounds;
        });
      }
    },
    [dataLength, proportionToZoomBound, setSelectedZoomLevel, setZoomBounds]
  );
  const mouseDownTrackHandler = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  const pointerDownTrackHandler = useCallback(
    (event) => {
      event.stopPropagation();

      pointerDownEventData.current = { clientX: event.clientX, zoomBounds };
      chartsRef.current.style.cursor = 'grabbing';
      trackRef.current.style.cursor = 'grabbing';
    },
    [chartsRef, zoomBounds]
  );
  const pointerUpTrackHandler = useCallback(
    (event) => {
      event.stopPropagation();

      pointerDownEventData.current = null;
      chartsRef.current.style.cursor = '';
      trackRef.current.style.cursor = 'grab';
    },
    [chartsRef]
  );
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
  const pointerDownRailHandler = useCallback(
    (event) => {
      event.stopPropagation();

      const railClientRect = event.target.getBoundingClientRect();
      const eventRailX = bound(event.clientX - railClientRect.left - 4, 0);
      const railWidth = event.target.clientWidth;
      const eventXProportion = (eventRailX / railWidth) * maxValue;

      setZoomBounds((prevZoomBounds) => {
        const [prevLowerZoomBound, prevUpperZoomBound] = prevZoomBounds;
        const prevDiff = prevUpperZoomBound - prevLowerZoomBound;
        const newMidBound = proportionToZoomBound(eventXProportion);
        const newLowerBound = newMidBound - prevDiff / 2;
        const newUpperBound = newMidBound + prevDiff / 2;
        const maxBound = dataLength - 1;
        let newZoomBounds = [newLowerBound, newUpperBound];

        if (newLowerBound < 0) {
          newZoomBounds = [0, prevDiff];
        } else if (newUpperBound > maxBound) {
          newZoomBounds = [maxBound - prevDiff, maxBound];
        }

        pointerDownEventData.current = {
          clientX: event.clientX,
          zoomBounds: newZoomBounds
        };
        chartsRef.current.style.cursor = 'grabbing';
        trackRef.current.style.cursor = 'grabbing';

        return newZoomBounds;
      });
    },
    [chartsRef, dataLength, proportionToZoomBound, setZoomBounds]
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

  useEffect(() => {
    const sliderRootElement = sliderRootRef.current;

    if (sliderRootRef.current) {
      const railEl = sliderRootElement.querySelector('.MuiSlider-rail');
      trackRef.current = sliderRootElement.querySelector('.MuiSlider-track');
      const trackEl = trackRef.current;

      const disablePassiveTouchStart = (el) => {
        el.addEventListener('touchstart', mouseDownTrackHandler, {
          passive: false
        });
      };

      disablePassiveTouchStart(railEl);
      disablePassiveTouchStart(trackEl);

      return () => {
        railEl.removeEventListener('touchstart', mouseDownTrackHandler);
        trackEl.removeEventListener('touchstart', mouseDownTrackHandler);
      };
    }
  }, [sliderRootRef, mouseDownTrackHandler]);

  return (
    <SliderUnstyled
      componentsProps={{
        rail: {
          onMouseDown: mouseDownTrackHandler,
          onPointerDown: pointerDownRailHandler
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
  setSelectedZoomLevel: PropTypes.func.isRequired,
  setZoomBounds: PropTypes.func.isRequired,
  zoomBounds: PropTypes.arrayOf(PropTypes.number)
};

export default ZoomSlider;
