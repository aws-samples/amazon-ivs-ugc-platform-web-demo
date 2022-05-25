import './StreamSession.css';
import EncoderConfiguration from './EncoderConfiguration';
import Metrics from './Metrics';
import StatsCard from './StatsCard/StatsCard';

const StreamSession = () => (
  <article className="stream-session">
    <StatsCard />
    <Metrics />
    <EncoderConfiguration />
  </article>
);

export default StreamSession;
