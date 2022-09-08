export const CHATLINE_BASE_CLASSES = [
  'bg-lightMode-gray-extraLight',
  'dark:bg-darkMode-gray-medium',
  'flex-row',
  'flex',
  'focus-visible:outline-none',
  'focus-visible:outline-offset-0',
  'items-start',
  'origin-top-left',
  'rounded-3xl'
];

export const TEXT_BASE_CLASSES = [
  'p1',
  'break-words',
  'text-left',
  'text-black',
  'dark:text-darkMode-gray-light',
  'min-w-0'
];

export const TEXT_VARIANT_CLASSES = {
  message: [],
  popup: ['mt-1']
};

export const CHATLINE_VARIANT_CLASSES = {
  message: [
    'dark:focus:bg-darkMode-gray-medium-hover',
    'dark:hover:bg-darkMode-gray',
    'focus-visible:ring-2',
    'focus-visible:ring-white',
    'focus:bg-darkMode-gray-medium-hover',
    'gap-x-1.5',
    'max-w-full',
    'px-3',
    'py-2.5',
    'w-auto'
  ],
  popup: ['cursor-default', 'gap-x-2', 'max-w-[700px]', 'w-full']
};
