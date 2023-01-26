import { forwardRef, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

import { clsm } from '../../../utils';
import { createAnimationProps } from '../../../helpers/animationPropsHelper';
import { dashboard as $dashboardContent } from '../../../content';
import { groupStreamSessions } from '../Header/utils';
import { useResponsiveDevice } from '../../../contexts/ResponsiveDevice';
import { useStreams } from '../../../contexts/Streams';
import Button from '../../../components/Button';
import StreamSessionButton from './StreamSessionButton';

const $content = $dashboardContent.header.session_navigator;

const NavigatorPopup = forwardRef(({ isNavOpen, toggleNavPopup }, ref) => {
  const {
    canLoadMoreStreamSessions,
    isLoadingNextStreamSessionsPage,
    streamSessions,
    updateActiveStreamSession,
    throttledUpdateStreamSessions
  } = useStreams();
  const { isDefaultResponsiveView } = useResponsiveDevice();
  const loadMoreSessionsBtnRef = useRef();

  const handleSessionClick = (streamSession) => {
    updateActiveStreamSession(streamSession);
    toggleNavPopup();
  };

  const handleLoadMoreStreamSessions = () => {
    throttledUpdateStreamSessions(true);
  };

  useEffect(() => {
    if (!isLoadingNextStreamSessionsPage) {
      loadMoreSessionsBtnRef.current?.blur();
    }
  }, [isLoadingNextStreamSessionsPage]);

  const renderPopup = () => (
    <motion.div
      {...createAnimationProps({
        customVariants: {
          hidden: { y: '-12.5%' },
          visible: { y: 0 }
        },
        transition: {
          damping: 25,
          duration: 0.15,
          stiffness: 350,
          type: 'spring'
        },
        options: {
          isVisible: isNavOpen,
          shouldAnimate: !isDefaultResponsiveView
        }
      })}
      className={clsm([
        'dark:bg-darkMode-gray-dark',
        'bg-lightMode-gray-extraLight',
        'h-[calc(100%_-_16px)]',
        'm-4',
        'max-h-[812px]',
        'max-w-[652px]',
        'md:h-full',
        'md:m-0',
        'md:max-h-full',
        'md:max-w-full',
        'md:rounded-none',
        'rounded-3xl',
        'w-full'
      ])}
    >
      <div
        className={clsm([
          'bg-transparent',
          'flex-col',
          'flex',
          'h-full',
          'items-center',
          'md:h-[calc(100%_-_64px)]',
          'overflow-x-hidden',
          'overflow-y-auto',
          'p-8',
          'scrollbar-mb-4',
          'scrollbar-mt-4',
          'sm:px-4',
          'space-y-8',
          'supports-overlay:overflow-y-overlay'
        ])}
        ref={ref}
        data-testid="stream-session-dropdown"
      >
        {streamSessions?.length ? (
          <>
            {groupStreamSessions(streamSessions).map(
              ({ groupLabel, sessionData }) => (
                <div
                  className={clsm(['flex-col', 'flex', 'space-y-4', 'w-full'])}
                  key={groupLabel.replace(/\s+/g, '-').toLowerCase()}
                >
                  <h4>{groupLabel}</h4>
                  {sessionData.map((streamSession, i) => (
                    <StreamSessionButton
                      key={streamSession.streamId}
                      streamSession={streamSession}
                      handleSessionClick={handleSessionClick}
                    />
                  ))}
                </div>
              )
            )}
            {canLoadMoreStreamSessions && (
              <Button
                className="w-48"
                isLoading={isLoadingNextStreamSessionsPage}
                onClick={handleLoadMoreStreamSessions}
                ref={loadMoreSessionsBtnRef}
                variant="secondary"
              >
                {$content.load_more_sessions}
              </Button>
            )}
          </>
        ) : (
          <span
            className={clsm([
              'text-lightMode-gray-medium',
              'mt-[calc(21%_-_30px)]',
              'text-center',
              'w-[200px]',
              'dark:text-darkMode-gray-light'
            ])}
            data-testid="no-streams"
          >
            <b className="font-medium">{$content.no_stream_sessions}</b>
            <p className={clsm(['mt-3', 'text-[13px]'])}>
              {$content.no_stream_sessions_message}
            </p>
          </span>
        )}
      </div>
    </motion.div>
  );

  return isDefaultResponsiveView ? (
    renderPopup()
  ) : (
    <motion.div
      {...createAnimationProps({
        animations: ['fadeIn-half'],
        options: {
          isVisible: isNavOpen
        }
      })}
      className={clsm([
        'absolute',
        'bg-modalOverlay',
        'flex',
        'h-[calc(100%_-_64px)]',
        'justify-center',
        'md:absolute',
        'md:bg-none',
        'md:h-full',
        'md:top-auto',
        'top-16',
        'w-full',
        'z-[550]'
      ])}
    >
      {renderPopup()}
    </motion.div>
  );
});

NavigatorPopup.defaultProps = { isNavOpen: false };

NavigatorPopup.propTypes = {
  isNavOpen: PropTypes.bool,
  toggleNavPopup: PropTypes.func.isRequired
};

export default NavigatorPopup;
