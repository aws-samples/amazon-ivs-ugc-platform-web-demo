import { channelDirectory as $channelDirectoryContent } from '../../content';
import { clsm } from '../../utils';
import liveStreams from '../../mocks/liveStreams.json';
import ChannelCard from '../../components/ChannelCard';

const $content = $channelDirectoryContent.live_streams_section;

const LiveStreamsSection = () => (
  <section className={clsm(['max-w-[960px]', 'space-y-8', 'w-full'])}>
    <h2 className={clsm(['text-black', 'dark:text-white'])}>
      {$content.title}
    </h2>
    <div
      className={clsm([
        'gap-8',
        'grid-cols-3',
        'grid',
        'lg:grid-cols-2',
        'sm:grid-cols-1'
      ])}
    >
      {liveStreams.map((liveStream) => (
        <ChannelCard {...liveStream} key={liveStream.username} />
      ))}
    </div>
  </section>
);

export default LiveStreamsSection;
