const BUTTON_BASE_CLASSES = [
  '[&>h1]:text-center',
  'flex-col',
  'flex',
  'relative',
  'w-full'
];

export const BUTTON_VARIANT_CLASSES = {
  vertical: [
    ...BUTTON_BASE_CLASSES,
    '[&>*:last-child]:pt-4',
    '[&>h1]:pb-4',
    'm-auto',
    'max-w-[450px]',
    'space-y-8'
  ],
  horizontal: [...BUTTON_BASE_CLASSES, 'space-y-5', 'md:m-auto']
};
