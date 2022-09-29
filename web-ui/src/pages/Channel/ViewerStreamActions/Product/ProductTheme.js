export const getPrimaryBgColorClass = (color) => `bg-profile-${color}`;

export const getSecondaryBgColorClasses = (color) => [
  `bg-profile-${color}-lightMode`,
  `dark:bg-profile-${color}-darkMode`,
  `focus:bg-profile-${color}-lightMode`,
  `dark:focus:bg-profile-${color}-darkMode`,
  `hover:bg-profile-${color}-lightMode-hover`,
  `dark:hover:bg-profile-${color}-darkMode-hover`
];
export const getSecondaryTextColorClass = (color) => `text-profile-${color}`;

export const shouldForceWhiteTextLightMode = (color) =>
  ['purple', 'salmon'].includes(color);

export const shouldForceWhiteTextLightDark = (color) => color === 'blue';
