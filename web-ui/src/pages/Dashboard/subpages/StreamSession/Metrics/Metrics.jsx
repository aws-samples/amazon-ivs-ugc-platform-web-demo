import { Provider as SynchronizedChartsProvider } from '../../../../../contexts/SynchronizedCharts';
import Charts from './Charts';
import StreamEvents from './StreamEvents';
import './Metrics.css';

const Metrics = () => (
  <section className="metrics-section">
    <SynchronizedChartsProvider>
      <Charts />
    </SynchronizedChartsProvider>
    <StreamEvents />
  </section>
);

export default Metrics;
