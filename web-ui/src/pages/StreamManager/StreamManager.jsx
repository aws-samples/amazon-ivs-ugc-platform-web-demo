import { clsm } from '../../utils';

import withVerticalScroller from '../../components/withVerticalScroller';

const StreamManager = () => {
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
      <h1>Stream Manager</h1>
    </div>
  );
};

export default withVerticalScroller(StreamManager);
