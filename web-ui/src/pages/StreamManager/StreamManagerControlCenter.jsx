import { useEffect, useRef, useState, forwardRef } from 'react';
import { useLocation } from 'react-router-dom';

import {
  STREAM_MANAGER_DEFAULT_TAB,
  STREAM_MANAGER_WEB_BROADCAST_TAB
} from '../../constants';
import { clsm } from '../../utils';
import { streamManager as $content } from '../../content';
import {
  StreamManagerActions,
  StreamManagerChat,
  StreamManagerWebBroadcast
} from './streamManagerCards';
import { useBroadcast } from '../../contexts/Broadcast';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';
import StreamManagerActionModal from './streamManagerCards/StreamManagerActions/StreamManagerActionModal';
import Tabs from '../../components/Tabs/Tabs';
import WebBroadcastSettingsModal from './streamManagerCards/StreamManagerWebBroadcast/WebBroadcastSettingsModal';

const StreamManagerControlCenter = forwardRef((_, previewRef) => {
  const { state } = useLocation();
  const [selectedTabIndex, setSelectedTabIndex] = useState(
    state?.streamManagerSelectedTab || 0
  );
  const [isBroadcastCardOpen, setIsBroadcastCardOpen] = useState(
    state?.isWebBroadcastContainerOpen || false
  );
  const { isDesktopView, currentBreakpoint } = useResponsiveDevice();
  const { resetPreview, initializeDevices, presetLayers, isBroadcasting } =
    useBroadcast();
  const areDevicesInitialized = useRef(false);
  const webBroadcastParentContainerRef = useRef();

  // Initialize devices when the user opens the broadcast card for the first time
  useEffect(() => {
    if (areDevicesInitialized.current || !isBroadcastCardOpen) return;

    (async function () {
      await initializeDevices();
      presetLayers.background.remove();
    })();

    areDevicesInitialized.current = true;
  }, [initializeDevices, presetLayers, isBroadcastCardOpen]);

  useEffect(() => {
    resetPreview();

    if (isDesktopView) {
      setSelectedTabIndex(STREAM_MANAGER_DEFAULT_TAB);
    } else {
      setIsBroadcastCardOpen(true);
      if (isBroadcasting) {
        setSelectedTabIndex(STREAM_MANAGER_WEB_BROADCAST_TAB);
      }
    }
  }, [isDesktopView, resetPreview, state, isBroadcasting, isBroadcastCardOpen]);

  return (
    <>
      <StreamManagerActionModal />
      <WebBroadcastSettingsModal />
      <div
        ref={webBroadcastParentContainerRef}
        className={clsm(['flex', 'h-full', 'w-full', 'max-w-[960px]'])}
      >
        <Tabs
          className={clsm([
            '[&>div]:px-0',
            '[&>div]:pt-0',
            '[&>div>button]:h-9'
          ])}
        >
          {!isDesktopView && (
            <Tabs.List
              selectedIndex={selectedTabIndex}
              setSelectedIndex={(tab) => {
                setSelectedTabIndex(tab);
              }}
              tabs={[
                {
                  label:
                    currentBreakpoint === 0
                      ? $content.stream_manager_web_broadcast.manage_stream.split(
                          ' '
                        )[0]
                      : $content.stream_manager_web_broadcast.manage_stream,
                  panelIndex: 0
                },
                {
                  label: $content.stream_manager_web_broadcast.go_live,
                  panelIndex: 1
                }
              ]}
            />
          )}
          <Tabs.Panel index={0} selectedIndex={selectedTabIndex}>
            <div
              className={clsm([
                'gap-6',
                'grid-cols-[351px,auto]',
                'grid',
                'grow',
                'h-full',
                'lg:grid-cols-none',
                'lg:grid-rows-[min-content,minmax(200px,100%)]',
                'max-w-[960px]',
                'w-full'
              ])}
            >
              <div
                className={clsm([
                  'overflow-hidden',
                  'h-full',
                  'relative',
                  'rounded-3xl',
                  'w-full'
                ])}
              >
                {isDesktopView && (
                  <StreamManagerWebBroadcast
                    ref={previewRef}
                    webBroadcastParentContainerRef={
                      webBroadcastParentContainerRef
                    }
                    isBroadcastCardOpen={isBroadcastCardOpen}
                    onExpand={() => setIsBroadcastCardOpen(true)}
                    onCollapse={() => setIsBroadcastCardOpen(false)}
                  />
                )}
                <StreamManagerActions />
              </div>
              <StreamManagerChat />
            </div>
          </Tabs.Panel>
          {!isDesktopView && (
            <Tabs.Panel index={1} selectedIndex={selectedTabIndex}>
              <StreamManagerWebBroadcast
                ref={previewRef}
                webBroadcastParentContainerRef={webBroadcastParentContainerRef}
                isBroadcastCardOpen={isBroadcastCardOpen}
                onExpand={() => setIsBroadcastCardOpen(true)}
                onCollapse={() => setIsBroadcastCardOpen(false)}
              />
            </Tabs.Panel>
          )}
        </Tabs>
      </div>
    </>
  );
});

export default StreamManagerControlCenter;
