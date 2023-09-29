import { forwardRef } from 'react';
import PropTypes from 'prop-types';

import { useBroadcastFullScreen } from '../../../../contexts/BroadcastFullscreen';
import { CreateVideo } from '../../../../assets/icons';
import { clsm, noop } from '../../../../utils';
import { streamManager as $content } from '../../../../content';
import { useBroadcast } from '../../../../contexts/Broadcast';
import { useResponsiveDevice } from '../../../../contexts/ResponsiveDevice';
import Button from '../../../../components/Button';
import FloatingNav from '../../../../components/FloatingNav';
import GoLiveContainer from './GoLiveContainer';
import GoLiveContainerCollapsed from './GoLiveContainerCollapsed';

const $webBroadcastContent = $content.stream_manager_web_broadcast;

const StreamManagerWebBroadcast = forwardRef(
  (
    { isBroadcastCardOpen, onCollapse, onExpand, setIsWebBroadcastAnimating },
    previewRef
  ) => {
    const { isBroadcasting } = useBroadcast();
    const { webBroadcastContainerRef } = useBroadcastFullScreen();
    const { isDesktopView } = useResponsiveDevice();

    const isDefaultGoLiveButton =
      !isBroadcastCardOpen && !isBroadcasting && isDesktopView;

    const handleOnCollapse = () => {
      onCollapse();
    };

    return (
      <section
        ref={webBroadcastContainerRef}
        className={clsm([
          'w-full',
          'h-fit',
          'grid',
          'bg-lightMode-gray-extraLight',
          'dark:bg-darkMode-gray-dark',
          'lg:max-w-full',
          'max-w-[351px]',
          'p-5',
          'rounded-3xl',
          'mb-6'
        ])}
      >
        <GoLiveContainer
          ref={previewRef}
          isOpen={isBroadcastCardOpen}
          onCollapse={handleOnCollapse}
          setIsWebBroadcastAnimating={setIsWebBroadcastAnimating}
        />
        {!isBroadcastCardOpen && isBroadcasting && isDesktopView && (
          <GoLiveContainerCollapsed
            isOpen={isBroadcastCardOpen}
            onExpand={onExpand}
          />
        )}
        {isDefaultGoLiveButton && (
          <Button
            onClick={onExpand}
            variant="primary"
            className={clsm([
              'h-14',
              'dark:[&>svg]:fill-black',
              'relative',
              '[&>svg]:h-6',
              '[&>svg]:w-6',
              'space-x-1',
              'rounded-xl'
            ])}
            data-testid="web-broadcast-go-live-button"
          >
            <CreateVideo />
            <p>{$webBroadcastContent.go_live}</p>
          </Button>
        )}
        <FloatingNav />
      </section>
    );
  }
);

StreamManagerWebBroadcast.propTypes = {
  isBroadcastCardOpen: PropTypes.bool.isRequired,
  onCollapse: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  setIsWebBroadcastAnimating: PropTypes.func
};

StreamManagerWebBroadcast.defaultProps = {
  setIsWebBroadcastAnimating: noop
};

export default StreamManagerWebBroadcast;
