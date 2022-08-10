import clsx from 'clsx';

import withVerticalScroller from '../../components/withVerticalScroller';

const Feed = () => {
  return (
    <div
      className={clsx(
        'flex',
        'items-center',
        'justify-center',
        'text-center',
        'h-screen',
        'w-full'
      )}
    >
      <h1>Feed</h1>
    </div>
  );
};

export default withVerticalScroller(Feed);
