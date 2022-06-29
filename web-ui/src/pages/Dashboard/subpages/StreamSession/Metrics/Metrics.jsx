import './Metrics.css';
import { Provider as SynchronizedChartsProvider } from '../../../../../contexts/SynchronizedCharts';
import { useOutletContext } from 'react-router-dom';
import Charts from './Charts';
import StreamEvents from './StreamEvents';

const Metrics = () => {
  const { activeStreamSession } = useOutletContext();
  const { isLive } = activeStreamSession || {};

  return (
    <section className="metrics-section">
      <SynchronizedChartsProvider isLive={isLive}>
        <Charts />
      </SynchronizedChartsProvider>
      <StreamEvents />
    </section>
  );
};

export default Metrics;
