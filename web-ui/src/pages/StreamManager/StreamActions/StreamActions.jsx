import { clsm } from '../../../utils';

import StreamActionButton from './StreamActionButton';

const StreamActions = () => {
  return (
    <section
      className={clsm([
        'bg-lightMode-gray-extraLight',
        'dark:bg-darkMode-gray-dark',
        'gap-5',
        'grid-cols-2',
        'grid-rows-[repeat(2,148px)]',
        'grid',
        'lg:grid-cols-4',
        'lg:grid-rows-[repeat(1,148px)]',
        'lg:max-w-full',
        'lg:min-h-[188px]',
        'max-w-[351px]',
        'overflow-auto',
        'p-5',
        'rounded-3xl',
        'sm:grid-rows-1',
        'sm:min-h-[105px]',
        'sm:overflow-hidden',
        'supports-overlay:overflow-overlay',
        'w-full'
      ])}
    >
      {Array(4) // Temporary
        .fill()
        .map((_, i) => (
          <StreamActionButton key={i} />
        ))}
    </section>
  );
};

export default StreamActions;
