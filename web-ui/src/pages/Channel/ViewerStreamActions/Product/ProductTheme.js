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
export const getSecondaryTextColorClass = (color) => `text-profile-${color}`;

export const shouldForceWhiteTextLightMode = (color) =>
  ['purple', 'salmon'].includes(color);

export const shouldForceWhiteTextLightDark = (color) => color === 'blue';
