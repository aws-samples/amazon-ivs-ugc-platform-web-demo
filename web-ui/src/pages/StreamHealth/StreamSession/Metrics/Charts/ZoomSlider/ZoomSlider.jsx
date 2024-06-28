import { useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import SliderUnstyled from '@mui/base/SliderUnstyled';

import {
  MIN_DISTANCE,
  ZOOM_LEVELS
} from '../../../../../../contexts/SynchronizedCharts';
import { bound, clsm, noop } from '../../../../../../utils';
import ThumbSlider from './ThumbSlider';

const maxValue = 1000;

const thumbHoverClasses = [
  'dark:shadow-darkMode-sliderThumb-hover',
  'shadow-[0_0_0_4px]',
  'shadow-lightMode-sliderThumb-hover'
];

const ZoomSlider = ({
  chartsRef = { current: null },
  dataLength = 0,
  eventsToDisplay = [],
  isEnabled = false,
  setSelectedZoomLevel,
  setZoomBounds,
  zoomBounds = [0, 0]
}) => {
  const [lowerBound, upperBound] = zoomBounds;
  const pointerDownEventData = useRef(null);
  const sliderRootRef = useRef();
  const trackRef = useRef();
  const railRef = useRef();

  const zoomBoundToProportion = useCallback(
    (val) => (val / (dataLength - 1)) * maxValue,
    [dataLength]
  );
  const proportionToZoomBound = useCallback(
    (proportion) => (proportion / maxValue) * (dataLength - 1),
    [dataLength]
  );

  const marks = useMemo(
    () =>
      eventsToDisplay.map(
        ({ zoomEventIndex }) => ({
          value: zoomBoundToProportion(zoomEventIndex)
        }),
        []
      ),
    [eventsToDisplay, zoomBoundToProportion]
  );

  const handleChange = useCallback(
    (_, newValues, activeThumb) => {
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
    const chartsEl = chartsRef.current;
    const trackEl = trackRef.current;

    if (chartsEl && isEnabled) {
      chartsEl.addEventListener('pointermove', pointerMoveTrackHandler);
      document.addEventListener('pointerup', pointerUpTrackHandler);

      return () => {
        chartsEl.removeEventListener('pointermove', pointerMoveTrackHandler);
        document.removeEventListener('pointerup', pointerUpTrackHandler);
        trackEl.style.cursor = '';
      };
    }
  }, [chartsRef, isEnabled, pointerMoveTrackHandler, pointerUpTrackHandler]);

  useEffect(() => {
    if (sliderRootRef.current) {
      const railEl = railRef.current;
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
  }, [sliderRootRef, mouseDownTrackHandler, isEnabled]);

  return (
    <SliderUnstyled
      className={clsm([
        'cursor-pointer',
        'h-3',
        'inline-flex',
        'items-center',
        'justify-center',
        'relative',
        'touch-none',
        'w-[calc(100%_-_12px)]',
        !isEnabled && ['cursor-auto', 'opacity-30']
      ])}
      componentsProps={{
        mark: {
          className: clsm([
            'absolute',
            'bg-lightMode-red',
            'dark:bg-darkMode-red',
            'h-1',
            'rounded-full',
            'w-1'
          ])
        },
        rail: {
          className: clsm([
            'absolute',
            'bg-clip-content',
            'bg-lightMode-gray',
            'block',
            'border-4',
            'border-transparent',
            'dark:bg-darkMode-gray',
            'h-3',
            'rounded-[100px]',
            'w-[calc(100%_+_20px)]'
          ]),
          onMouseDown: isEnabled ? mouseDownTrackHandler : noop,
          onPointerDown: isEnabled ? pointerDownRailHandler : noop,
          ref: railRef
        },
        track: {
          className: clsm([
            'absolute',
            'bg-clip-content',
            'bg-lightMode-gray-medium',
            'block',
            'border-transparent',
            'border-y-4',
            'cursor-grab',
            'dark:bg-darkMode-gray-light',
            'h-3.5',
            !isEnabled && [
              'bg-lightMode-gray',
              'cursor-auto',
              'dark:bg-darkMode-gray'
            ]
          ]),
          onMouseDown: isEnabled ? mouseDownTrackHandler : noop,
          onPointerDown: isEnabled ? pointerDownTrackHandler : noop,
          ref: trackRef
        },
        thumb: {
          className: clsm([
            'absolute',
            'bg-lightMode-gray-dark',
            'box-border',
            'dark:bg-darkMode-gray-extraLight',
            'h-3',
            'outline-0',
            'rounded-full',
            'shadow-none',
            'shadow-transparent',
            'transition-shadow',
            'w-3',
            !isEnabled && [
              'bg-lightMode-gray',
              'cursor-auto',
              'dark:bg-darkMode-gray',
              'dark:shadow-[#1f1f1f]',
              'shadow-[0_0_0_4px]',
              'shadow-lightMode-gray-extraLight'
            ]
          ]),
          onMouseEnter: ({ target }) =>
            isEnabled &&
            !target.className.includes('Mui-active') &&
            target.classList.add(...thumbHoverClasses),
          onMouseOut: ({ target }) =>
            isEnabled && target.classList.remove(...thumbHoverClasses)
        }
      }}
      components={{
        Thumb: ThumbSlider
      }}
      disableSwap
      disabled={!isEnabled}
      marks={marks}
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

ZoomSlider.propTypes = {
  chartsRef: PropTypes.object,
  dataLength: PropTypes.number,
  eventsToDisplay: PropTypes.arrayOf(
    PropTypes.shape({ zoomEventIndex: PropTypes.number })
  ),
  isEnabled: PropTypes.bool,
  setSelectedZoomLevel: PropTypes.func.isRequired,
  setZoomBounds: PropTypes.func.isRequired,
  zoomBounds: PropTypes.arrayOf(PropTypes.number)
};

export default ZoomSlider;
