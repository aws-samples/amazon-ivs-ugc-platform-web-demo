import { ParentSize } from '@visx/responsive';

import Chart from './Chart';

const ResponsiveChart = (props) => (
  <ParentSize className="md:max-h-[100px]" debounceTime={0}>
    {({ width, height }) => <Chart {...props} height={height} width={width} />}
  </ParentSize>
);

export default ResponsiveChart;
