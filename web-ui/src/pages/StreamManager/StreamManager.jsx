import { clsm } from '../../utils';

import withVerticalScroller from '../../components/withVerticalScroller';
import StatusBar from './StatusBar';

const StreamManager = () => (
  <div
    className={clsm(
      'flex-col',
      'flex',
      'gap-y-6',
      'h-screen',
      'items-center',
      'overflow-auto',
      'px-8',
      'py-6',
      'sm:px-4',
      'w-full'
    )}
  >
    <StatusBar />
  </div>
);

export default withVerticalScroller(StreamManager);
