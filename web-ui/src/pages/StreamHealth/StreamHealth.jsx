import './StreamHealth.css';
import { clsm } from '../../utils';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useStreams } from '../../contexts/Streams';
import { WITH_VERTICAL_SCROLLER_BASE_CLASSES } from '../../components/withVerticalScroller/withVerticalScrollerTheme';
import Header from './Header';
import StreamSession from './StreamSession';
import useScrollToTop from '../../hooks/useScrollToTop';

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
      <section
        className={clsm([
          'stream-health-section',
          ...WITH_VERTICAL_SCROLLER_BASE_CLASSES
        ])}
      >
        <StreamSession />
      </section>
    </>
  );
};

export default StreamHealth;
