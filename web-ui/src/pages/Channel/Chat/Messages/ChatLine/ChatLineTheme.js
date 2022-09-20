export const CHATLINE_BASE_CLASSES = [
  'bg-lightMode-gray-light',
  'dark:bg-darkMode-gray-medium',
  'duration-[0.15s]',
  'ease-in-out',
  'flex-row',
  'flex',
  'items-start',
  'origin-top-left',
  'transition-all'
];

export const CHATLINE_VARIANT_CLASSES = {
  message: [
    'gap-x-1.5',
    'max-w-full',
    'px-3.5',
    'py-3',
    'w-auto',
    'rounded-3xl'
  ],
  popup: [
    'cursor-default',
    'gap-x-2',
    'md:max-w-[700px]',
    'w-full',
    'bg-lightMode-gray-light',
    'supports-overlay:overflow-y-overlay',
    'overflow-y-scroll'
  ]
};

export const CHATLINE_HOVER_AND_FOCUS_CLASSES = [
  'dark:focus:bg-darkMode-gray-medium',
  'dark:focus:ring-white',
  'dark:hover:bg-darkMode-gray-medium-hover',
  'focus:bg-lightMode-gray-light',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-black',
  'hover:bg-lightMode-gray-light-hover'
];

export const TEXT_BASE_CLASSES = [
  'break-all',
  'dark:text-darkMode-gray-light',
  'min-w-0',
  'p1',
  'text-black',
  'text-left'
];

export const TEXT_VARIANT_CLASSES = {
  message: ['dark:text-darkMode-gray-light', 'text-lightMode-gray-dark'],
  popup: [
    '[&>b]:text-lightMode-gray-dark',
    'dark:[&>b]:text-darkMode-gray-light',
    'dark:text-white',
    'mt-1',
    'text-black'
  ]
};
