import { ParentSize } from '@visx/responsive';
import PropTypes from 'prop-types';

import Chart from './Chart';

const ResponsiveChart = ({ data, formatter, maximum }) => (
  <ParentSize>
    {({ width, height }) => (
      <Chart
        data={data}
        maximum={maximum}
        formatter={formatter}
        height={height}
        width={width}
      />
    )}
  </ParentSize>
);

ResponsiveChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  formatter: PropTypes.func,
  maximum: PropTypes.number
};

ResponsiveChart.defaultProps = {
  data: [],
  formatter: (data) => data,
  maximum: null
};

export default ResponsiveChart;
