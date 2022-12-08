import { useCallback, useEffect, useState } from 'react';

import { channelDirectory as $channelDirectoryContent } from '../../content';
import { clsm } from '../../utils';
import { getAvatarSrc } from '../../helpers';
import { getLiveChannels } from '../../api/channels';
import { SmartToy } from '../../assets/icons';
import { useNotif } from '../../contexts/Notification';
import Button from '../../components/Button';
import ChannelCard from '../../components/ChannelCard';
import Spinner from '../../components/Spinner';

const $content = $channelDirectoryContent.live_streams_section;

const FULL_PAGE_DIV_BASE_CLASSES = [
  'absolute',
  'flex-col',
  'flex',
  'h-screen',
  'items-center',
  'justify-center',
  'left-0',
  'top-0',
  'w-full'
];

const LiveStreamsSection = () => {
  const { notifyError } = useNotif();
  const [data, setData] = useState();
  const [error, setError] = useState();
  const isLoading = !error && !data;
  const { channels: liveChannels } = data || {};
  const hasLiveChannels = !!liveChannels?.length;

  const getSectionData = useCallback(async () => {
    setData(undefined);
    setError(undefined);

    const { result, error: fetchError } = await getLiveChannels();

    setData(result);
    setError(fetchError);

    if (fetchError)
      notifyError(
        $channelDirectoryContent.notification.error.error_loading_streams
      );
  }, [notifyError]);

  useEffect(() => {
    getSectionData();
  }, [getSectionData]);

  return (
    <section
      className={clsm([
        'max-w-[960px]',
        'h-full',
        'w-full',
        hasLiveChannels && 'space-y-8'
      ])}
    >
      <h2 className={clsm(['text-black', 'dark:text-white'])}>
        {$content.title}
      </h2>
      {!isLoading && hasLiveChannels && (
        <div
          className={clsm([
            'gap-8',
            'grid-cols-3',
            'grid',
            'lg:grid-cols-2',
            'sm:grid-cols-1'
          ])}
        >
          {liveChannels.map((liveChannel) => {
            const { color, username } = liveChannel;

            return (
              <ChannelCard
                avatarSrc={getAvatarSrc(liveChannel)}
                color={color}
                username={username}
                key={liveChannel.username}
              />
            );
          })}
        </div>
      )}
      {!isLoading && !hasLiveChannels && (
        <div className={clsm([FULL_PAGE_DIV_BASE_CLASSES, 'space-y-8'])}>
          <div
            className={clsm([
              'flex',
              'flex-col',
              'items-center',
              'justify-center',
              'opacity-50',
              'space-y-2'
            ])}
          >
            <SmartToy
              className={clsm([
                '[&>path]:fill-black',
                '[&>path]:dark:fill-white'
              ])}
            />
            <h3 className={clsm(['text-black', 'dark:text-white'])}>
              {$content.no_streams_available}
            </h3>
          </div>
          {!!error && (
            <Button onClick={getSectionData} variant="secondary">
              {$content.try_again}
            </Button>
          )}
        </div>
      )}
      {isLoading && (
        <div className={clsm(FULL_PAGE_DIV_BASE_CLASSES)}>
          <Spinner size="large" variant="light" />
        </div>
      )}
    </section>
  );
};

export default LiveStreamsSection;
