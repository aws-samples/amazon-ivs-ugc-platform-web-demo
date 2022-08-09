import { ParentSize } from '@visx/responsive';

import Chart from './Chart';
import './Chart.css';

const ResponsiveChart = (props) => (
  <ParentSize className="parent-size" debounceTime={0}>
    {({ width, height }) => <Chart {...props} height={height} width={width} />}
  </ParentSize>
);

export default ResponsiveChart;
