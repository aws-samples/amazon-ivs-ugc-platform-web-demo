import { ParentSize } from '@visx/responsive';

import Chart from './Chart';

const ResponsiveChart = (props) => (
  <ParentSize>
    {({ width, height }) => <Chart {...props} height={height} width={width} />}
  </ParentSize>
);

export default ResponsiveChart;
