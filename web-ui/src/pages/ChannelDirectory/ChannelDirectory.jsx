import clsx from 'clsx';

import withVerticalScroller from '../../components/withVerticalScroller';

const ChannelDirectory = () => {
  return (
    <div
      className={clsx(
        'flex',
        'items-center',
        'justify-center',
        'text-center',
        'h-full',
        'w-full'
      )}
    >
      <h1>Channel Directory</h1>
    </div>
  );
};

export default withVerticalScroller(ChannelDirectory);
