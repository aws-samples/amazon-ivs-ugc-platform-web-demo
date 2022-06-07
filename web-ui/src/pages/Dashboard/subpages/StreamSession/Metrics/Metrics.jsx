import { Provider as SynchronizedChartTooltipProvider } from '../../../../../contexts/SynchronizedChartTooltip';
import Charts from './Charts';
import StreamEvents from './StreamEvents';
import './Metrics.css';

const Metrics = () => (
  <section className="metrics-section">
    <SynchronizedChartTooltipProvider>
      <Charts />
    </SynchronizedChartTooltipProvider>
    <StreamEvents />
  </section>
);

export default Metrics;
