const OUTER_INPUT_BASE_CLASSES = ['flex', 'relative', 'w-full', 'min-w-[90px]'];

export const OUTER_INPUT_VARIANT_CLASSES = {
  vertical: [...OUTER_INPUT_BASE_CLASSES, 'flex-col', 'justify-center'],
  horizontal: [
    ...OUTER_INPUT_BASE_CLASSES,
    'flex-grow',
    'flex-row',
    'items-center',
    'justify-start'
  ]
};

export const INNER_INPUT_VARIANT_CLASSES = [
  '[&>input:not([type="password"]),&>input:placeholder-shown]:overflow-hidden',
  'flex-col',
  'flex',
  'item-start',
  'items-start',
  'relative',
  'w-full'
];

export const INPUT_BASE_CLASSES = [
  'appearance-none',
  'bg-lightMode-gray-light',
  'border-none',
  'dark:bg-darkMode-gray-medium',
  'dark:focus:shadow-white',
  'dark:hover:bg-darkMode-gray-medium-hover',
  'dark:hover:text-darkMode-gray-extraLight',
  'dark:text-darkMode-gray-light',
  'duration-[0.5ms]',
  'ease-in-out',
  'focus:outline-none',
  'focus:shadow-darkMode-gray-dark',
  'focus:shadow-focus',
  'font-body',
  'font-normal',
  'h-[44px]',
  'hover:bg-lightMode-gray-light-hover',
  'hover:text-lightMode-gray-dark',
  'min-w-[90px]',
  'px-5',
  'py-[14px]',
  'read-only:cursor-auto',
  'rounded-3xl',
  'text-[15px]',
  'text-lightMode-gray-medium',
  'transition-all',
  'w-full'
];

export const INPUT_ERROR_CLASSES = ['shadow-darkMode-red', 'shadow-focus'];

export const INPUT_TYPE_CLASSES = {
  text: [
    ...INPUT_BASE_CLASSES,
    'dark:text-white',
    'placeholder-shown:overflow-hidden',
    'placeholder-shown:text-ellipsis',
    'placeholder-shown:whitespace-nowrap',
    'text-lightMode-gray-dark'
  ],
  password: [
    ...INPUT_BASE_CLASSES,
    'dark:text-white',
    'text-lightMode-gray-dark'
  ]
};