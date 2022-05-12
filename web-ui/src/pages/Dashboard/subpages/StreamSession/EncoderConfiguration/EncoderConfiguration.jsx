import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';

import { dashboard as $dashboardContent } from '../../../../../content';
import { processEncoderConfigData } from './utils';
import ConfigRow from './ConfigRow';
import './EncoderConfiguration.css';

const $content = $dashboardContent.stream_session_page.encoder_configuration;

const EncoderConfiguration = () => {
  const activeStreamSession = useOutletContext();
  const encoderConfigValues = useMemo(() => {
    const { ingestConfiguration, channel, metrics } = activeStreamSession || {};
    const { type: channelType } = channel || {};
    const {
      data: {
        0: { value: keyframeIntervalAvg }
      }
    } = metrics?.find(({ label }) => label === 'KeyframeIntervalAvg') || {
      data: [{ value: null }]
    };

    if (ingestConfiguration) {
      ingestConfiguration.video.keyframeIntervalAvg = keyframeIntervalAvg;
    }

    return processEncoderConfigData(ingestConfiguration, channelType);
  }, [activeStreamSession]);

  return (
    <section className="encoder-config-section">
      <h3>{$content.title}</h3>
      <div className="config-grid">
        {encoderConfigValues.map(({ id, ...configData }) => (
          <ConfigRow key={id} {...configData} />
        ))}
      </div>
    </section>
  );
};

export default EncoderConfiguration;
