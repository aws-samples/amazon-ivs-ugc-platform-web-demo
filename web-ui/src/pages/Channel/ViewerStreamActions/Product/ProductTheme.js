import { clsm } from '../../../../utils';

export const getPrimaryBgColorClass = (color) => `bg-profile-${color}`;

export const getPrimaryButtonBgColorClass = (color) => [
  `bg-profile-${color}-lightMode-primary`,
  `focus:bg-profile-${color}-lightMode-primary`,
  `hover:bg-profile-${color}-lightMode-primary-hover`,
  `dark:bg-profile-${color}-darkMode-primary`,
  `dark:focus:bg-profile-${color}-darkMode-primary`,
  `dark:hover:bg-profile-${color}-darkMode-primary-hover`
];

export const getSecondaryBgColorClasses = (color) => [
  `bg-profile-${color}-lightMode-secondary`,
  `focus:bg-profile-${color}-lightMode-secondary`,
  `hover:bg-profile-${color}-lightMode-secondary-hover`,
  `dark:bg-profile-${color}-darkMode-secondary`,
  `dark:focus:bg-profile-${color}-darkMode-secondary`,
  `dark:hover:bg-profile-${color}-darkMode-secondary-hover`
];

export const amazonButtonClasses = [
  'bg-darkMode-orange',
  'dark:hover:bg-darkMode-orange-hover',
  'focus:bg-darkMode-orange',
  'focus:dark:ring-white',
  'focus:ring-black',
  'hover:bg-lightMode-orange-hover'
];

export const getSecondaryTextColorClass = (color) => `text-profile-${color}`;

export const shouldForceWhiteTextLightMode = (color) =>
  ['purple', 'salmon'].includes(color);

export const shouldForceWhiteTextLightDark = (color) => color === 'blue';

export const commonProductContainerClasses = (
  isOverlayVisible,
  shouldShowStream
) =>
  clsm([
    'absolute',
    'bg-white',
    'bottom-4',
    'dark:bg-[#161616F2]',
    'max-w-[256px]',
    'right-4',
    'rounded-3xl',
    'transition-[margin]',
    'w-full',
    'mb-4',
    isOverlayVisible && shouldShowStream && 'mb-20'
  ]);

export const productCardClasses = (isMobileView) =>
  clsm([
    'break-anywhere',
    'flex-col',
    'flex',
    'items-center',
    'p-5',
    'rounded-3xl',
    'space-y-4',
    'w-full',
    isMobileView && 'mb-12'
  ]);

export const productHeaderClasses = clsm([
  'dark:text-white',
  'font-bold',
  'leading-6',
  'text-black',
  'text-xl',
  'line-clamp-2'
]);
