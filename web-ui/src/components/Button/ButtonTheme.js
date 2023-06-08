export const BUTTON_OUTLINE_CLASSES = [
  'focus:outline-none',
  'focus:shadow-focus',
  'shadow-black',
  'dark:shadow-white'
];

export const BUTTON_BASE_CLASSES = [
  '[&>svg]:fill-black',
  'border-none',
  'cursor-pointer',
  'dark:[&>svg]:fill-white',
  'disabled:cursor-auto',
  'disabled:opacity-30',
  'disabled:pointer-events-none',
  'duration-[0.15s]',
  'ease-in-out',
  'flex',
  'h-[44px]',
  'items-center',
  'justify-center',
  'min-w-[98px]',
  'px-6',
  'py-3',
  'rounded-3xl',
  'select-none',
  'transition',
  'w-auto',
  'whitespace-nowrap',
  ...BUTTON_OUTLINE_CLASSES
];

const TEXT_BASE_CLASSES = [
  'bg-transparent',
  'dark:[&>.spinner]:text-white',
  'dark:text-darkMode-blue',
  'text-lightMode-blue-medium'
];

const TEXT_BASE_HOVER_CLASSES = [
  'dark:hover:bg-darkMode-gray-hover',
  'hover:bg-lightMode-gray-light-hover'
];

export const BUTTON_HOVER_CLASSES = {
  primary: ['hover:bg-darkMode-blue-hover'],
  secondary: ['dark:hover:bg-darkMode-gray-hover', 'hover:bg-white-hover'],
  tertiary: [
    'dark:hover:bg-darkMode-gray-extraLight-hover',
    'hover:bg-lightMode-gray-hover'
  ],
  destructive: ['hover:bg-darkMode-red-hover'],
  icon: [
    'dark:hover:bg-darkMode-gray-hover',
    'hover:bg-lightMode-gray-light-hover'
  ],
  primaryText: [
    ...TEXT_BASE_HOVER_CLASSES,
    'focus:bg-lightMode-gray-light-hover',
    'hover:bg-lightMode-gray-light-hover'
  ],
  secondaryText: TEXT_BASE_HOVER_CLASSES,
  tertiaryText: [
    ...TEXT_BASE_HOVER_CLASSES,
    'hover:bg-lightMode-gray-light-hover'
  ]
};

export const BUTTON_VARIANT_CLASSES = {
  primary: [
    '[&>svg]:fill-black',
    'bg-darkMode-blue',
    'focus:bg-darkMode-blue',
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
    'dark:text-white',
    'focus:bg-white',
    'text-black'
  ],
  tertiary: [
    '[&>svg]:fill-black',
    'bg-lightMode-gray',
    'dark:bg-darkMode-gray-extraLight',
    'dark:focus:bg-darkMode-gray-extraLight',
    'focus:bg-lightMode-gray',
    'text-black'
  ],
  destructive: [
    '[&>.spinner]text-white',
    '[&>svg]:fill-white',
    'bg-darkMode-red',
    'dark:text-black',
    'focus:bg-darkMode-red',
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
    'focus:bg-lightMode-gray-light-hover',
    'h-auto',
    'min-w-[auto]',
    'p-2.5',
    'rounded-[50%]'
  ],
  primaryText: [
    ...TEXT_BASE_CLASSES,
    '[&.spinner]:text-black',
    '[&>svg]:fill-lightMode-blue-medium',
    'dark:[&>svg]:fill-darkMode-blue',
    'dark:text-darkMode-blue',
    'focus:bg-lightMode-gray-light-hover',
    'text-lightMode-blue-medium'
  ],
  secondaryText: [
    ...TEXT_BASE_CLASSES,
    'dark:text-white',
    'text-black',
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
    'space-x-3',
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
