export const CHATLINE_BASE_CLASSES = [
  'bg-lightMode-gray-extraLight',
  'dark:bg-darkMode-gray-medium',
  'duration-[0.15s]',
  'ease-in-out',
  'flex-row',
  'flex',
  'items-start',
  'origin-top-left',
  'rounded-3xl',
  'transition-all'
];

export const CHATLINE_VARIANT_CLASSES = {
  message: ['gap-x-1.5', 'max-w-full', 'px-3', 'py-2.5', 'w-auto'],
  popup: ['cursor-default', 'gap-x-2', 'max-w-[700px]', 'w-full']
};

export const CHATLINE_HOVER_AND_FOCUS_CLASSES = [
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-white',
  'focus:bg-darkMode-gray-medium-hover',
  'dark:focus:bg-darkMode-gray-medium-hover',
  'dark:hover:bg-darkMode-gray'
];

export const TEXT_BASE_CLASSES = [
  'break-words',
  'dark:text-darkMode-gray-light',
  'min-w-0',
  'p1',
  'text-black',
  'text-left'
];

export const TEXT_VARIANT_CLASSES = { popup: ['mt-1'] };
