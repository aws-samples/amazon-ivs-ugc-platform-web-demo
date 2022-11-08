/**
 * This is the safelist of classes that we force Tailwind to generate, based on different regex patterns.
 * It allows us to create dynamic classes, based on the user's profile color.
 * Regex patterns that are added to this list should be as specific as possible. Using the wrong pattern can lead to a large increase in the CSS bundle size.
 */

module.exports = [
  /**
   * Base class, used in various places across the app.
   * It should not export any variants.
   */
  { pattern: /^bg-profile-([a-z]+)(-(dark|extraLight))?$/ },
  /**
   * Quiz Viewer Action component (QuizCard.jsx)
   */
  {
    pattern: /^bg-profile-([a-z]+)-light$/,
    variants: ['focus']
  },
  {
    pattern: /^bg-profile-([a-z]+)-light-hover$/,
    variants: ['hover']
  },
  /**
   * Product Viewer Action component (ProductTheme.js and ProductButtons.jsx)
   */
  {
    pattern: /^bg-profile-([a-z]+)-lightMode-(primary|secondary)$/,
    variants: ['focus']
  },
  {
    pattern: /^bg-profile-([a-z]+)-lightMode-(primary|secondary)-hover$/,
    variants: ['hover']
  },
  {
    pattern: /^bg-profile-([a-z]+)-darkMode-(primary|secondary)$/,
    variants: ['dark']
  },
  {
    pattern: /^bg-profile-([a-z]+)-darkMode-(primary|secondary)$/,
    variants: ['dark:focus']
  },
  {
    pattern: /^bg-profile-([a-z]+)-darkMode-(primary|secondary)-hover$/,
    variants: ['dark:hover']
  },
  { pattern: /^text-profile-([a-z]+)$/, variants: ['dark'] },
  /**
   * Stream Manager Action Button component (StreamManagerActionButton.jsx)
   */
  {
    pattern: /^bg-profile-([a-z]+)-hover$/,
    variants: ['hover']
  },
  {
    pattern: /^(stroke|ring)-profile-([a-z]+)-hover$/,
    variants: ['group-hover']
  },
  { pattern: /^(ring|fill|stroke)-profile-([a-z]+)$/ }, // Also used in UserAvatar.jsx
  /**
   * Used in the ChannelCard component (ChannelCard.jsx)
   */
  {
    pattern: /^bg-profile-([a-z]+)-lightMode-primary-hover$/,
    variants: ['group-hover']
  },
  {
    pattern: /^bg-profile-([a-z]+)-darkMode-primary-hover$/,
    variants: ['dark:group-hover']
  },
  {
    pattern: /^bg-profile-([a-z]+)-lightMode-dark-hover$/,
    variants: ['group-hover']
  },
  {
    pattern: /^bg-profile-([a-z]+)-darkMode-dark-hover$/,
    variants: ['dark:group-hover']
  }
];
