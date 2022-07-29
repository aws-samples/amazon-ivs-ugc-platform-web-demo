import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';

import './Dashboard.css';
import { useMobileBreakpoint } from '../../contexts/MobileBreakpoint';
import { useStreams } from '../../contexts/Streams';
import FloatingMenu from './FloatingMenu';
import FloatingPlayer from './FloatingPlayer';
import Header from './Header';

import useScrollToTop from '../../hooks/useScrollToTop';
import withVerticalScroller from '../../components/withVerticalScroller/withVerticalScroller';

const Dashboard = () => {
  const {
    activeStreamSession,
    fetchActiveStreamSessionError,
    fetchStreamSessionsError,
    hasActiveStreamChanged,
    hasStreamSessions,
    isInitialFetchingStreamData,
    isLoadingStreamData,
    refreshCurrentActiveStreamSession,
    refreshCurrentStreamSessionsWithLoading
  } = useStreams();
  const { isDefaultResponsiveView } = useMobileBreakpoint();
  const outletContext = useMemo(
    () => ({
      activeStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      hasActiveStreamChanged,
      hasStreamSessions,
      isInitialFetchingStreamData,
      isLoadingStreamData,
      refreshCurrentActiveStreamSession,
      refreshCurrentStreamSessionsWithLoading
    }),
    [
      activeStreamSession,
      fetchActiveStreamSessionError,
      fetchStreamSessionsError,
      hasActiveStreamChanged,
      hasStreamSessions,
      isInitialFetchingStreamData,
      isLoadingStreamData,
      refreshCurrentActiveStreamSession,
      refreshCurrentStreamSessionsWithLoading
    ]
  );

  useScrollToTop({
    dependency: activeStreamSession?.streamId,
    isResponsiveView: isDefaultResponsiveView
  });

  return (
    <>
      <Header />
      <section className="dashboard-section-container">
        <Outlet context={outletContext} />
      </section>
      {isDefaultResponsiveView ? <FloatingMenu /> : <FloatingPlayer />}
    </>
  );
};

export default withVerticalScroller(Dashboard);
