import { clsm } from '../../utils';

import withVerticalScroller from '../../components/withVerticalScroller';

const ChannelDirectory = () => {
  return (
    <div
      className={clsm(
        'flex',
        'items-center',
        'justify-center',
        'text-center',
        'h-screen',
        'w-full'
      )}
    >
      <h1>Channel Directory</h1>
    </div>
  );
};

export default withVerticalScroller(ChannelDirectory);
