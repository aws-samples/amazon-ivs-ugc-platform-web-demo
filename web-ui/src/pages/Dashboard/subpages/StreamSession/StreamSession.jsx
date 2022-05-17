import EncoderConfiguration from './EncoderConfiguration';
import Metrics from './Metrics';
import './StreamSession.css';

const StreamSession = () => (
  <article className="stream-session">
    <Metrics />
    <EncoderConfiguration />
  </article>
);

export default StreamSession;
