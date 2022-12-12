import { useMemo } from 'react';

import { clsm } from '../../../../utils';
import { dashboard as $dashboardContent } from '../../../../content';
import { KEYFRAME_INTERVAL } from '../../../../constants';
import { processEncoderConfigData } from './utils';
import { useStreams } from '../../../../contexts/Streams';
import ConfigRow from './ConfigRow';

const $content = $dashboardContent.stream_session_page.encoder_configuration;

const EncoderConfiguration = () => {
  const { activeStreamSession } = useStreams();
  const encoderConfigValues = useMemo(() => {
    const { ingestConfiguration, channel, metrics } = activeStreamSession || {};
    const { type: channelType } = channel || {};
    const {
      statistics: { average: keyframeIntervalAvg }
    } = metrics?.find(({ label }) => label === KEYFRAME_INTERVAL) || {
      statistics: { average: null }
    };
    let extendedIngestConfiguration;

    if (ingestConfiguration) {
      const { video: ingestVideoConfiguration } = ingestConfiguration || {};
      extendedIngestConfiguration = {
        ...ingestConfiguration,
        video: { ...ingestVideoConfiguration, keyframeIntervalAvg }
      };
    }

    return processEncoderConfigData(extendedIngestConfiguration, channelType);
  }, [activeStreamSession]);

  return (
    <section className={clsm(['w-full', 'p-[30px]', 'md:px-4'])}>
      <h3 className="mb-[30px]">{$content.title}</h3>
      <div
        className={clsm([
          'grid',
          'grid-cols-2',
          'md:grid-cols-1',
          'gap-y-8',
          'gap-x-[60px]',
          'h-[236px]',
          'lg:flex-nowrap',
          'lg:h-auto'
        ])}
      >
        {encoderConfigValues.map(({ id, ...configData }) => (
          <ConfigRow key={id} {...configData} />
        ))}
      </div>
    </section>
  );
};

export default EncoderConfiguration;
