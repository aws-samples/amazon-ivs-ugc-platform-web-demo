import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AreaClosed, Line, Bar } from '@visx/shape';
import { LinearGradient } from '@visx/gradient';
import { max, bisector, extent } from 'd3-array';
import { getDate, getDataValue, getXScale, getYScale } from '../utils';
import { scaleLinear } from '@visx/scale';
import { useTooltip, Tooltip } from '@visx/tooltip';

import { useMobileBreakpoint } from '../../../../../../../contexts/MobileBreakpoint';
import { useSynchronizedChartTooltip } from '../../../../../../../contexts/SynchronizedChartTooltip';
import usePrevious from '../../../../../../../hooks/usePrevious';
import useStateWithCallback from '../../../../../../../hooks/useStateWithCallback';
import './Chart.css';

const bisectDate = bisector(getDate).left;

const Chart = ({
  formatter,
  height,
  initialData,
  maximum,
  width,
  zoomBounds
}) => {
  const {
    hideTooltip,
    showTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipOpen,
    tooltipTop = 0
  } = useTooltip();
  const {
    handleSynchronizedTooltips,
    hideSynchronizedTooltips,
    showSynchronizedTooltips,
    xValue: x
  } = useSynchronizedChartTooltip();
  const tooltipRef = useRef();
  const [hasTooltipRendered, setHasTooltipRendered] =
    useStateWithCallback(false);
  const [isTooltipReady, setIsTooltipReady] = useState(false);
  const [transformedData, setTransformedData] = useState(initialData);
  const prevZoomBounds = usePrevious(zoomBounds);
  const xScale = useMemo(
    () => getXScale(width, transformedData),
    [width, transformedData]
  );
  const yScale = useMemo(
    () => getYScale(height, maximum || max(transformedData, getDataValue)),
    [transformedData, height, maximum]
  );
  const { isMobileView } = useMobileBreakpoint();

  // Update the transformed data when the zoom bounds have been updated
  useEffect(() => {
    if (!prevZoomBounds) return;

    const [lowerBound, upperBound] = zoomBounds;
    const [prevLowerBound, prevUpperBound] = prevZoomBounds;

    if (prevLowerBound !== lowerBound || prevUpperBound !== upperBound) {
      setTransformedData(initialData.slice(lowerBound, upperBound));
    }
  }, [initialData, prevZoomBounds, zoomBounds]);

  useEffect(() => {
    setHasTooltipRendered(tooltipOpen);
  }, [setHasTooltipRendered, tooltipOpen]);

  useEffect(() => {
    setIsTooltipReady(hasTooltipRendered);
  }, [hasTooltipRendered]);

  // tooltip handler
  useEffect(() => {
    if (x === null) {
      setHasTooltipRendered(false, hideTooltip);
      return;
    }

    const dateToPixels = scaleLinear({
      range: [0, width],
      domain: extent(transformedData, getDate),
      nice: false
    });
    const x0 = xScale.invert(x);
    const index = bisectDate(transformedData, x0, 1);
    const d0 = transformedData[index - 1];
    const d1 = transformedData[index];
    if (!d0 || !d1) {
      setHasTooltipRendered(false, hideTooltip);
      return;
    }

    const { timestamp: t0, value: v0 } = d0;
    const { timestamp: t1, value: v1 } = d1;

    const t0px = dateToPixels(t0);
    const t1px = dateToPixels(t1);
    const v0px = yScale(v0);
    const v1px = yScale(v1);

    const slope = (v1px - v0px) / (t1px - t0px);
    const yInt = v0px - slope * t0px;
    const y = slope * x + yInt;

    let d = d0;
    if (d1 && getDate(d1)) {
      d =
        x0.valueOf() - getDate(d0).valueOf() >
        getDate(d1).valueOf() - x0.valueOf()
          ? d1
          : d0;
    }

    showTooltip({
      tooltipData: formatter({ timestamp: x0, value: d.value }),
      tooltipLeft: x,
      tooltipTop: y
    });
  }, [
    transformedData,
    formatter,
    hideTooltip,
    setHasTooltipRendered,
    showTooltip,
    width,
    x,
    xScale,
    yScale
  ]);

  useEffect(() => {
    if (isMobileView) {
      if (hasTooltipRendered) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = null;
      }
    }
  }, [isMobileView, hasTooltipRendered]);

  if (width < 10) return null;

  return (
    <div className="chart-container">
      <svg width="100%" height={height}>
        <LinearGradient
          id="area-gradient"
          from="var(--palette-color-chart-gradient-start)"
          to="var(--palette-color-chart-gradient-end)"
          fromOpacity={1}
          toOpacity={0}
        />
        <AreaClosed
          data={transformedData}
          x={(d) => xScale(getDate(d)) ?? 0}
          y={(d) => yScale(getDataValue(d)) ?? 0}
          yScale={yScale}
          strokeWidth={2}
          stroke="var(--palette-color-blue)"
          fill="url(#area-gradient)"
          clipPath="inset(0 1px 1px 1px)"
        />
        <Bar
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          rx={14}
          onTouchStart={handleSynchronizedTooltips}
          onTouchMove={handleSynchronizedTooltips}
          onTouchEnd={hideSynchronizedTooltips}
          onMouseEnter={showSynchronizedTooltips}
          onMouseMove={handleSynchronizedTooltips}
          onMouseLeave={hideSynchronizedTooltips}
        />
        {hasTooltipRendered && (
          <g>
            <Line
              className="tooltip-line"
              from={{ x: tooltipLeft, y: 0 }}
              to={{ x: tooltipLeft, y: height }}
            />
            <circle
              className="tooltip-circle"
              cx={tooltipLeft}
              cy={tooltipTop}
              r={4}
            />
          </g>
        )}
      </svg>
      <Tooltip
        className={`chart-tooltip ${
          hasTooltipRendered && isTooltipReady ? '' : 'hidden'
        }`}
        left={0}
        top={0}
        style={{
          transform: `translate(${Math.max(
            -10,
            tooltipLeft - tooltipRef.current?.clientWidth - 20 || 0
          )}px, ${tooltipTop - tooltipRef.current?.clientHeight - 20 || 0}px)`,
          transition: isTooltipReady ? 'transform 100ms linear' : undefined
        }}
      >
        <div ref={tooltipRef}>
          <h4>{tooltipData && getDataValue(tooltipData)}</h4>
          <p className="p3">{tooltipData && getDate(tooltipData)}</p>
        </div>
      </Tooltip>
    </div>
  );
};

Chart.propTypes = {
  formatter: PropTypes.func,
  height: PropTypes.number.isRequired,
  initialData: PropTypes.arrayOf(PropTypes.object),
  maximum: PropTypes.number,
  width: PropTypes.number.isRequired,
  zoomBounds: PropTypes.arrayOf(PropTypes.number).isRequired
};

Chart.defaultProps = {
  initialData: [],
  formatter: (data) => data,
  maximum: null
};

export default Chart;
