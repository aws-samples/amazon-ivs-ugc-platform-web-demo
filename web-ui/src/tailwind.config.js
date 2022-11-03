/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const {
  default: flattenColorPalette
} = require('tailwindcss/lib/util/flattenColorPalette');
const colors = require('./colors');
const { animation, keyframes } = require('./animations');

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      lg: { max: '989px' },
      md: { max: '767px' },
      sm: { max: '575px' },
      xs: { max: '330px' }
    },
    fontFamily: {
      body: [
        'Inter',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Open Sans',
        'Helvetica Neue',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol'
      ]
    },
    extend: {
      animation,
      boxShadow: {
        focus: `inset 0 0 0 2px var(--tw-shadow-color)`,
        focusOuter: ` 0 0 0 2px var(--tw-shadow-color)`,
        hover: `inset 0 0 0 3px var(--tw-shadow-color)`,
        hoverOuter: ` 0 0 0 3px var(--tw-shadow-color)`
      },
      colors,
      height: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      keyframes,
      maxHeight: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      maxWidth: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      minHeight: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      minWidth: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      width: { screen: 'calc(var(--mobile-vw,1vw) * 100)' }
    }
  },
  safelist: [
    { pattern: /^(ring|fill|stroke)-profile-([a-z]+)$/ },
    {
      pattern: /^bg-profile([-a-zA-Z]+)$/,
      variants: ['hover', 'focus', 'dark', 'dark:hover', 'dark:focus']
    },
    {
      pattern: /^(stroke|ring)-profile-([a-z]+)-hover$/,
      variants: ['group-hover']
    },
    { pattern: /^text-profile-([a-z]+)$/, variants: ['dark'] },
    {
      pattern: /^bg-profile-([a-z]+)-lightMode-primary-hover$/, // Used in ChannelCard.jsx
      variants: ['group-hover']
    },
    {
      pattern: /^bg-profile-([a-z]+)-darkMode-primary-hover$/, // Used in ChannelCard.jsx
      variants: ['dark:group-hover']
    },
    {
      pattern: /^bg-profile-([a-z]+)-(lightMode)-dark-hover$/, // Used in ChannelCard.jsx
      variants: ['group-hover']
    },
    {
      pattern: /^bg-profile-([a-z]+)-(darkMode)-dark-hover$/, // Used in ChannelCard.jsx
      variants: ['dark:group-hover']
    }
  ],
  corePlugins: { aspectRatio: false },
  plugins: [
    /**
     * A plugin that provides utilities for visually truncating text after a fixed number of lines.
     * https://github.com/tailwindlabs/tailwindcss-line-clamp
     */
    require('@tailwindcss/line-clamp'),

    // aspect-ratio (modern and legacy support)
    plugin(({ addUtilities }) => {
      addUtilities({
        '.aspect-video': {
          aspectRatio: '16 / 9',
          '@supports not (aspect-ratio: 16 / 9)': {
            position: 'relative',
            width: '100%',
            height: 0,
            paddingBottom: '56.25%' /* 16:9 */
          }
        },
        '.aspect-auto': {
          aspectRatio: 'auto',
          '@supports not (aspect-ratio: auto)': {
            position: 'relative',
            width: '100%',
            height: '100%',
            paddingBottom: 0
          }
        },
        '.aspect-square': {
          aspectRatio: '1 / 1',
          '@supports not (aspect-ratio: 1 / 1)': {
            position: 'relative',
            width: '100%',
            height: 0,
            paddingBottom: '100%' /* 1:1 */,
            '& > div': {
              /* Center align content */
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          }
        }
      });
    }),

    // @supports (overflow: overlay)
    plugin(({ addVariant, addUtilities }) => {
      addVariant('supports-overlay', '@supports (overflow: overlay)');
      addUtilities({
        '.overflow-overlay': { overflow: 'overlay' },
        '.overflow-x-overlay': { overflowX: 'overlay' },
        '.overflow-y-overlay': { overflowY: 'overlay' }
      });
    }),
    // @media (hover:none)
    plugin(({ addVariant }) => {
      addVariant('touch-screen-device', '@media (hover:none)');
    }),

    // remove scrollbar
    plugin(({ addUtilities }) => {
      addUtilities({
        '.no-scrollbar': {
          /* IE and Edge */
          '-ms-overflow-style': 'none',

          /* Firefox */
          'scrollbar-width': 'none',

          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      });
    }),

    // used to break words onto another line for long character counts
    plugin(({ addUtilities }) => {
      addUtilities({
        '.break-anywhere': {
          'overflow-wrap': 'anywhere'
        }
      });
    }),

    // scrollbar thumb color
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'scrollbar-color': (color) => ({
            'scrollbar-color': `${color} transparent`,
            '&::-webkit-scrollbar-thumb': {
              boxShadow: `inset 0 0 10px 10px ${color}`
            }
          })
        },
        { values: flattenColorPalette(theme('colors')) }
      );
    }),

    // Scrollbar-track: Add styles to scrollbar
    plugin(({ matchUtilities, theme }) => {
      matchUtilities(
        {
          'scrollbar-mt': (value) => ({
            '&::-webkit-scrollbar-track': {
              marginTop: value
            }
          })
        },
        { values: theme('margin') }
      );
    })
  ]
};
