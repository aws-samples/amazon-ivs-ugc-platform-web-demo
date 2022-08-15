import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useStreams } from '../../contexts/Streams';
import FloatingPlayer from './FloatingPlayer';
import Header from './Header';
import StreamSession from './StreamSession';
import useScrollToTop from '../../hooks/useScrollToTop';
import '../../components/withVerticalScroller/withVerticalScroller.css';
import './StreamHealth.css';

const StreamHealth = () => {
  const { activeStreamSession } = useStreams();
  const { isDefaultResponsiveView, isLandscape, isTouchscreenDevice } =
    useMobileBreakpoint();

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
      {!isDefaultResponsiveView && (!isLandscape || !isTouchscreenDevice) && (
        <FloatingPlayer />
      )}
    </>
  );
};

export default StreamHealth;
