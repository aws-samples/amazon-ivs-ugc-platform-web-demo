import './Metrics.css';
import { clsm } from '../../../../utils';
import { Provider as SynchronizedChartsProvider } from '../../../../contexts/SynchronizedCharts';
import { useStreams } from '../../../../contexts/Streams';
import Charts from './Charts';
import StreamEvents from './StreamEvents';

const Metrics = () => {
  const { activeStreamSession } = useStreams();
  const { isLive } = activeStreamSession || {};

  return (
    <section className={clsm(['metrics-section', 'md:py-4'])}>
      <SynchronizedChartsProvider isLive={isLive}>
        <Charts />
      </SynchronizedChartsProvider>
      <StreamEvents />
    </section>
  );
};

export default Metrics;
