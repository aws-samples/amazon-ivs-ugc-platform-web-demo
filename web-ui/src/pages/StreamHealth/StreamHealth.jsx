import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useStreams } from '../../contexts/Streams';
import FloatingMenu from './FloatingMenu';
import FloatingPlayer from './FloatingPlayer';
import Header from './Header';
import StreamSession from './StreamSession';
import useScrollToTop from '../../hooks/useScrollToTop';
import '../../components/withVerticalScroller/withVerticalScroller.css';
import './StreamHealth.css';

const StreamHealth = () => {
  const { activeStreamSession } = useStreams();
  const { isDefaultResponsiveView } = useMobileBreakpoint();

  useScrollToTop({
    dependency: activeStreamSession?.streamId,
    isResponsiveView: isDefaultResponsiveView
  });

  return (
    <>
      <Header />
      <section className="stream-health-section vertical-scroller-container">
        <StreamSession />
      </section>
      {isDefaultResponsiveView ? <FloatingMenu /> : <FloatingPlayer />}
    </>
  );
};

export default StreamHealth;
