import clsx from 'clsx';

import withVerticalScroller from '../../components/withVerticalScroller';

const Following = () => {
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
      <h1>Following</h1>
    </div>
  );
};

export default withVerticalScroller(Following);
