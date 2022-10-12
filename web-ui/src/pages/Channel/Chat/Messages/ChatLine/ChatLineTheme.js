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
    'bg-transparent',
    'cursor-default',
    'dark:bg-transparent',
    'gap-x-2',
    'md:max-w-[700px]',
    'overflow-y-scroll',
    'pb-[2px]',
    'pt-4',
    'px-4',
    'rounded-3xl',
    'supports-overlay:overflow-y-overlay',
    'scrollbar-mt-4',
    'w-full'
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
  '[&>b]:break-all',
  'break-words',
  'dark:text-darkMode-gray-light',
  'min-w-0',
  'p1',
  'text-left',
  'text-lightMode-gray-dark'
];

export const TEXT_VARIANT_CLASSES = {
  message: [],
  popup: ['mt-1']
};
