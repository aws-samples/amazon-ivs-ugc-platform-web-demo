/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const {
  default: flattenColorPalette
} = require('tailwindcss/lib/util/flattenColorPalette');

const { animation, keyframes } = require('./tailwind/animations');
const colors = require('./tailwind/colors');
const safelist = require('./tailwind/safelist');

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
      containers: {
        'stage-video-xl': '320px',
        'stage-video-lg': '240px',
        'stage-video-md': '180px',
        'stage-video-sm': '120px'
      },
      animation,
      transitionDuration: { 0: '0ms' },
      boxShadow: {
        focus: `inset 0 0 0 2px var(--tw-shadow-color)`,
        focusOuter: ` 0 0 0 2px var(--tw-shadow-color)`,
        hover: `inset 0 0 0 3px var(--tw-shadow-color)`,
        hoverOuter: ` 0 0 0 3px var(--tw-shadow-color)`
      },
      colors,
      fontSize: {
        p1: [
          '15px',
          {
            lineHeight: '22.5px',
            fontWeight: '400'
          }
        ],
        p2: [
          '13px',
          {
            lineHeight: '19.5px',
            fontWeight: '400'
          }
        ],
        p3: [
          '0.75rem',
          {
            lineHeight: '15px',
            fontWeight: '500'
          }
        ],
        p4: [
          '14px',
          {
            lineHeight: '17px',
            fontWeight: 700
          }
        ],
        h3: [
          '1.125rem',
          {
            lineHeight: '21.78px',
            fontWeight: '700'
          }
        ]
      },
      height: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      keyframes,
      maxHeight: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      maxWidth: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      minHeight: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      minWidth: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      width: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      dropShadow: {
        'stage-profile': [
          '0px 2px 2px rgba(0, 0, 0, 0.1)',
          '0px 0px 4px rgba(0, 0, 0, 0.2)'
        ]
      }
    }
  },
  safelist,
  plugins: [
    /**
     * A plugin for Tailwind CSS v3.2+ that provides utilities for container queries.
     * https://github.com/tailwindlabs/tailwindcss-container-queries
     */
    require('@tailwindcss/container-queries'),

    // @supports (overflow: overlay)
    plugin(({ addVariant, addUtilities }) => {
      addVariant('supports-overlay', '@supports (overflow: overlay)');
      addUtilities({
        '.overflow-overlay': { overflow: 'overlay' },
        '.overflow-x-overlay': { overflowX: 'overlay' },
        '.overflow-y-overlay': { overflowY: 'overlay' }
      });
    }),
    // Used to detect touchscreen devices, mirrors the logic in the ResponsiveDevice context
    plugin(({ addVariant }) => {
      addVariant(
        'touch-screen-device',
        '@media not all and (hover: hover) and (pointer: fine)'
      );
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
          }),
          'scrollbar-mb': (value) => ({
            '&::-webkit-scrollbar-track': {
              marginBottom: value
            }
          })
        },
        { values: theme('margin') }
      );
    }),

    // Support pointer-events all
    plugin(({ addUtilities }) => {
      addUtilities({
        '.pointer-events-all': { pointerEvents: 'all' }
      });
    })
  ]
};
