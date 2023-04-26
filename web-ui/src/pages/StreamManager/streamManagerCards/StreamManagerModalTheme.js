import { clsm } from '../../../utils';

export const getModalFormClasses = (isLandscape) => [
  'flex',
  'flex-col',
  'justify-between',
  'rounded-3xl',
  'max-h-[calc(100vh_-_2*24px)]',
  'bg-white',
  'dark:bg-darkMode-gray-medium',
  'md:h-full',
  'md:max-h-screen',
  'md:rounded-none',
  isLandscape && [
    'touch-screen-device:lg:h-full',
    'touch-screen-device:lg:max-h-screen',
    'touch-screen-device:lg:rounded-none',
    'max-h-[calc(calc(var(--mobile-vh,1vh)_*_100)_-_32px)]'
  ]
];

export const getModalContainerClasses = (isLandscape) => [
  'px-12',
  'pt-12',
  'h-auto',
  'md:px-4',
  'md:pt-6',
  'overflow-x-hidden',
  'overflow-y-auto',
  'supports-overlay:overflow-y-overlay',
  'scrollbar-mt-4',
  isLandscape && ['touch-screen-device:lg:px-4', 'touch-screen-device:lg:pt-6']
];

export const getFormHeaderClasses = (isAmazonProduct) =>
  clsm([
    'text-center',
    'pb-12',
    'text-black',
    'dark:text-white',
    'm-auto',
    isAmazonProduct
      ? ['xs:max-w-[220px]', 'sm:max-w-[256px]']
      : 'max-w-[calc(calc(var(--mobile-vw,1vw)_*_100)_-_120px)]'
  ]);

export const MODAL_CLOSE_BUTTON_CLASSES = [
  '[&>svg]:dark:fill-white',
  '[&>svg]:fill-darkMode-gray-dark',
  '[&>svg]:h-6',
  '[&>svg]:w-6',
  'absolute',
  'bg-white',
  'dark:bg-darkMode-gray-medium',
  'right-4',
  'top-4'
];

export const MODAL_OVERFLOW_DIVIDER_CLASSES = [
  'border-t-[1px]',
  'border-lightMode-gray',
  'dark:border-black'
];
