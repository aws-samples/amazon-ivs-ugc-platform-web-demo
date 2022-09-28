/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const {
  default: flattenColorPalette
} = require('tailwindcss/lib/util/flattenColorPalette');

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
      boxShadow: {
        focus: `inset 0 0 0 2px var(--tw-shadow-color)`,
        focusOuter: ` 0 0 0 2px var(--tw-shadow-color)`,
        hover: `inset 0 0 0 3px var(--tw-shadow-color)`,
        hoverOuter: ` 0 0 0 3px var(--tw-shadow-color)`
      },
      height: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      minHeight: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      maxHeight: { screen: 'calc(var(--mobile-vh,1vh) * 100)' },
      width: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      minWidth: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      maxWidth: { screen: 'calc(var(--mobile-vw,1vw) * 100)' },
      colors: {
        loadingOverlay: 'hsl(0 0% 0% / 0.3)',
        modalOverlay: 'hsl(0 0% 0% / 0.5)',
        white: {
          DEFAULT: 'hsl(var(--base-color-white), 100%)',
          hover: 'hsl(var(--base-color-white), 90%)',
          player: 'hsl(var(--base-color-white), 85%)'
        },
        black: {
          DEFAULT: 'hsl(var(--base-color-white), 0%)',
          hover: 'hsl(var(--base-color-white), 10%)',
          gradient: 'hsl(var(--base-color-white), 0%, 0.75)'
        },
        darkMode: {
          gray: {
            DEFAULT: 'hsl(var(--base-color-medium-gray), 27%)',
            hover: 'hsl(var(--base-color-medium-gray), 37%)',
            tabButton: 'hsl(var(--base-color-medium-gray), 13%)',
            extraLight: {
              DEFAULT: 'hsl(var(--base-color-extra-light-gray), 86%)',
              hover: 'hsl(var(--base-color-extra-light-gray),96%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-color-light-gray), 71%)',
              hover: 'hsl(var(--base-color-light-gray), 81%)'
            },
            medium: {
              DEFAULT: 'hsl(var(--base-color-medium-gray), 18%)',
              hover: 'hsl(var(--base-color-medium-gray), 28%)'
            },
            dark: {
              DEFAULT: 'hsl(var(--base-color-dark-gray), 10%)',
              hover: 'hsl(var(--base-color-dark-gray), 20%)'
            }
          },
          turquoise: {
            DEFAULT: 'hsl(var(--base-color-turquoise), 42%)',
            hover: 'hsl(var(--base-color-turquoise), 52%)'
          },
          green: {
            DEFAULT: 'hsl(var(--base-color-green), 53%)',
            hover: 'hsl(var(--base-color-green), 63%)'
          },
          red: {
            DEFAULT: 'hsl(var(--base-color-red), 51%)',
            hover: 'hsl(var(--base-color-red), 61%)',
            gradient: {
              start: 'hsla(var(--base-color-red), 51%, 0)',
              end: 'hsla(var(--base-color-red), 51%, 0.4)'
            }
          },
          blue: {
            DEFAULT: 'hsl(var(--base-color-blue), 63%)',
            hover: 'hsl(var(--base-color-blue), 73%)',
            medium: {
              DEFAULT: 'hsl(var(--base-color-blue), 38%)',
              hover: 'hsl(var(--base-color-blue), 48%)'
            },
            gradient: {
              start: 'hsla(var(--base-color-blue),63%,0.25)',
              end: 'hsla(240, 100, 63%, 0)'
            }
          }
        },
        lightMode: {
          gray: {
            DEFAULT: 'hsl(var(--base-color-white), 80%)',
            hover: 'hsl(var(--base-color-white), 70%)',
            tabButton: 'hsl(var(--base-color-white), 95%)',
            extraLight: {
              DEFAULT: 'hsl(var(--base-color-white), 96%)',
              hover: 'hsl(var(--base-color-white), 86%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-color-white), 91%)',
              hover: 'hsl(var(--base-color-white), 81%)'
            },
            medium: {
              DEFAULT: 'hsl(var(--base-color-white), 42%)',
              hover: 'hsl(var(--base-color-white), 32%)'
            },
            dark: {
              DEFAULT: 'hsl(var(--base-color-white), 27%)',
              hover: 'hsl(var(--base-color-white), 17%)'
            }
          },
          turquoise: {
            DEFAULT: 'hsl(var(--base-color-turquoise), 26%)',
            hover: 'hsl(var(--base-color-turquoise), 16%)'
          },
          green: {
            DEFAULT: 'hsl(var(--base-color-medium-green), 33%)',
            hover: 'hsl(var(--base-color-medium-green), 23%)'
          },
          red: {
            DEFAULT: 'hsl(var(--base-color-light-red), 45%)',
            hover: 'hsl(var(--base-color-light-red), 35%)'
          },
          blue: {
            DEFAULT: 'hsl(var(--base-color-blue), 63%)',
            hover: 'hsl(var(--base-color-blue), 53%)',
            medium: {
              DEFAULT: 'hsl(var(--base-color-medium-blue), 37%)',
              hover: 'hsl(var(--base-color-medium-blue), 27%)'
            }
          }
        },
        profile: {
          default: {
            DEFAULT: 'hsl(var(--base-profile-color-default), 48%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-default), 38%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-default), 63%)',
              hover: 'hsl(var(--base-profile-color-default), 73%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-default), 73%)'
            }
          },
          green: {
            DEFAULT: 'hsl(var(--base-profile-color-green), 42%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-green), 32%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-green), 50%)',
              hover: 'hsl(var(--base-profile-color-green), 60%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-green), 55%)'
            }
          },
          yellow: {
            DEFAULT: 'hsl(var(--base-profile-color-yellow), 64%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-yellow), 38%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-yellow), 75%)',
              hover: 'hsl(var(--base-profile-color-yellow), 85%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-yellow), 80%)'
            }
          },
          blue: {
            DEFAULT: 'hsl(var(--base-profile-color-blue), 64%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-blue), 59%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-blue), 72%)',
              hover: 'hsl(var(--base-profile-color-blue), 82%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-blue), 80%)'
            }
          },
          salmon: {
            DEFAULT: 'hsl(var(--base-profile-color-salmon), 71%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-salmon), 61%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-salmon), 81%)',
              hover: 'hsl(var(--base-profile-color-salmon), 91%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-salmon), 85%)'
            }
          },
          purple: {
            DEFAULT: 'hsl(var(--base-profile-color-purple), 54%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-purple), 44%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-purple), 64%)',
              hover: 'hsl(var(--base-profile-color-purple), 74%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-purple), 70%)'
            }
          },
          turquoise: {
            DEFAULT: 'hsl(var(--base-profile-color-turquoise), 67%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-turquoise), 42%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-turquoise), 87%)',
              hover: 'hsl(var(--base-profile-color-turquoise), 97%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-turquoise), 90%)'
            }
          },
          lavender: {
            DEFAULT: 'hsl(var(--base-profile-color-lavender), 86%)',
            dark: {
              DEFAULT: 'hsl(var(--base-profile-color-lavender), 76%)'
            },
            light: {
              DEFAULT: 'hsl(var(--base-profile-color-lavender), 92%)',
              hover: 'hsl(var(--base-color-white), 100%)'
            },
            extraLight: {
              DEFAULT: 'hsl(var(--base-profile-color-lavender), 98%)'
            }
          }
        }
      },
      animation: {
        blink: 'blink 0.45s infinite'
      },
      keyframes: {
        blink: {
          '50%': { opacity: '0.8' }
        }
      }
    }
  },
  safelist: [
    { pattern: /(border|ring)-profile(-.*)?/ },
    { pattern: /bg-profile(-.*)?/, variants: ['hover'] }
  ],
  corePlugins: { aspectRatio: false },
  plugins: [
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
            paddingBottom: '100%' /* 1:1 */
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
    // Lobotomized Owl Selector (https://www.markhuot.com/2019/01/01/tailwindcss-owl)
    plugin(({ e, matchUtilities, config, theme }) => {
      const lobotomizedOwlSelector = '& > * + *';

      matchUtilities(
        {
          o: (value) => ({
            [lobotomizedOwlSelector]: { marginTop: value }
          })
        },
        { values: theme('margin') }
      );
    })
  ]
};
