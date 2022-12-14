import { clsm } from '../../../../utils';
import { Provider as SynchronizedChartsProvider } from '../../../../contexts/SynchronizedCharts';
import { useStreams } from '../../../../contexts/Streams';
import Charts from './Charts';
import StreamEvents from './StreamEvents';

const Metrics = () => {
  const { activeStreamSession } = useStreams();
  const { isLive } = activeStreamSession || {};

  return (
    <section
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'flex',
        'h-[552px]',
        'items-start',
        'justify-center',
        'md:flex-col',
        'md:h-auto',
        'md:py-4',
        'md:space-x-0',
        'md:space-y-8',
        'mx-0',
        'my-4',
        'rounded-3xl',
        'space-x-5',
        'w-full'
      ])}
    >
      <SynchronizedChartsProvider isLive={isLive}>
        <Charts />
      </SynchronizedChartsProvider>
      <StreamEvents />
    </section>
  );
};

export default Metrics;
