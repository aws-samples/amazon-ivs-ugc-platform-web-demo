export const BUTTON_BASE_CLASSES = [
  '[&>svg]:fill-black',
  'border-none',
  'cursor-pointer',
  'dark:[&>svg]:fill-white',
  'dark:shadow-white',
  'disabled:cursor-auto',
  'disabled:opacity-30',
  'disabled:pointer-events-none',
  'duration-[0.15s]',
  'ease-in-out',
  'flex',
  'focus:outline-none',
  'shadow-black',
  'focus:shadow-focus',
  'h-[44px]',
  'items-center',
  'justify-center',
  'min-w-[98px]',
  'px-6',
  'py-3',
  'rounded-3xl',
  'select-none',
  'transition-all',
  'w-auto',
  'whitespace-nowrap'
];

const TEXT_BASE_CLASSES = [
  'bg-transparent',
  'dark:[&>.spinner]:text-white',
  'dark:hover:bg-darkMode-gray-hover',
  'dark:text-darkMode-blue',
  'hover:bg-lightMode-gray-light-hover',
  'text-lightMode-blue-medium'
];

export const BUTTON_VARIANT_CLASSES = {
  primary: [
    '[&>svg]:fill-black',
    'bg-darkMode-blue',
    'focus:bg-darkMode-blue',
    'hover:bg-darkMode-blue-hover',
    'text-black'
  ],
  secondary: [
    '[&>.spinner]:text-black',
    '[&>svg]:fill-black',
    'bg-white',
    'dark:[&>.spinner]:text-white',
    'dark:[&>svg]:fill-white',
    'dark:bg-darkMode-gray',
    'dark:focus:bg-darkMode-gray',
    'dark:hover:bg-darkMode-gray-hover',
    'dark:text-white',
    'focus:bg-white',
    'hover:bg-white-hover',
    'text-black'
  ],
  tertiary: [
    '[&>svg]:fill-black',
    'bg-lightMode-gray',
    'dark:bg-darkMode-gray-extraLight',
    'dark:focus:bg-darkMode-gray-extraLight',
    'dark:hover:bg-darkMode-gray-extraLight-hover',
    'focus:bg-lightMode-gray',
    'hover:bg-lightMode-gray-hover',
    'text-black'
  ],
  destructive: [
    '[&>.spinner]text-white',
    '[&>svg]:fill-white',
    'bg-darkMode-red',
    'dark:text-black',
    'focus:bg-darkMode-red',
    'hover:bg-darkMode-red-hover',
    'text-white'
  ],
  icon: [
    '[&>svg:disabled]:fill-lightMode-gray-dark',
    '[&>svg:focus]:fill-black',
    '[&>svg]:fill-black',
    '[&>svg]:fill-lightMode-gray-dark',
    'bg-transparent',
    'dark:[&>svg:disabled]:fill-white',
    'dark:[&>svg:focus]:fill-white',
    'dark:[&>svg]:fill-white',
    'dark:focus:bg-darkMode-gray-hover',
    'dark:hover:bg-darkMode-gray-hover',
    'focus:bg-lightMode-gray-light-hover',
    'h-auto',
    'hover:bg-lightMode-gray-light-hover',
    'min-w-[auto]',
    'px-2',
    'py-2',
    'rounded-[50%]'
  ],
  primaryText: [
    ...TEXT_BASE_CLASSES,
    '[&.spinner]:text-black',
    '[&>svg]:fill-lightMode-blue-medium',
    'dark:[&>svg]:fill-darkMode-blue',
    'dark:text-darkMode-blue',
    'focus:bg-lightMode-gray-light-hover',
    'hover:bg-lightMode-gray-light-hover',
    'text-lightMode-blue-medium'
  ],
  secondaryText: [
    ...TEXT_BASE_CLASSES,
    'dark:[&]:text-white',
    '[&]:text-black',
    '[&>.spinner]:text-white',
    '[&>svg]:fill-white',
    'dark:text-white'
  ],
  tertiaryText: [
    ...TEXT_BASE_CLASSES,
    '[&.spinner]:text-black',
    '[&>svg]:fill-black',
    'dark:[&>svg]:fill-white',
    'dark:text-darkMode-blue',
    'dark:text-white',
    'gap-x-3',
    'hover:bg-lightMode-gray-light-hover',
    '!justify-start',
    'px-3',
    'py-1.5',
    'round-lg',
    'rounded-lg',
    'text-black',
    'text-lightMode-blue-medium'
  ]
};

export const BUTTON_LINK_CLASSES = [
  'border-none',
  'm-0, py-3, px-6',
  'outline-none'
];
