import { Link } from 'react-router-dom';

import { channelDirectory as $channelDirectoryContent } from '../../content';
import { clsm } from '../../utils';
import { useResponsiveDevice } from '../../contexts/ResponsiveDevice';

const $content = $channelDirectoryContent.following_section;

const ViewAllButton = () => {
  const { isTouchscreenDevice } = useResponsiveDevice();

  return (
    <Link
      className={clsm([
        'aspect-square',
        'bg-lightMode-gray-light',
        'button',
        'dark:bg-darkMode-gray-medium',
        'focus:ring-black',
        'dark:focus:ring-white',
        'dark:ring-darkMode-gray',
        'dark:text-white',
        'focus:outline-none',
        'flex',
        'group',
        'h-auto',
        'items-center',
        'justify-center',
        'ring-lightMode-gray',
        'ring-4',
        'rounded-full',
        'text-black',
        'text-h3',
        'w-full',
        !isTouchscreenDevice && [
          'dark:hover:ring-darkMode-gray-hover',
          'hover:ring-[6px]',
          'hover:ring-lightMode-gray-hover',
          'hover:scale-110',
          'transition-all'
        ]
      ])}
      to="following"
    >
      {$content.view_all}
    </Link>
  );
};

export default ViewAllButton;
