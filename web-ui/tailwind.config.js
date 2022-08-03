/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    colors: {
      white: {
        DEFAULT: 'hsl(var(--base-color-white), 100%)',
        hover: 'hsl(var(--base-color-white), 90%)'
      },
      black: {
        DEFAULT: 'hsl(var(--base-color-white), 0%)',
        hover: 'hsl(var(--base-color-white), 10%)'
      },
      darkMode: {
        gray: {
          DEFAULT: 'hsl(var(--base-color-medium-gray), 27%)',
          hover: 'hsl(var(--base-color-medium-gray), 37%)',
          extraLight: {
            DEFAULT: 'hsl(var(--base-color-extra-light-gray), 86%)',
            hover: 'hsl(var(--base-color-extra-light-gray),96%)',
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
        green: {
          DEFAULT: 'hsl(var(--base-color-green), 53%)',
          hover: 'hsl(var(--base-color-green), 63%)'
        },
        red: {
          DEFAULT: 'hsl(var(--base-color-red), 51%)',
          hover: 'hsl(var(--base-color-red), 61%)',
          gradient: {
            start: 'hsla(var(--base-color-red), 51%, 0)',
            end: 'hsla(var(--base-color-red), 51%, 0.4)',
          }
        },
        blue: {
          DEFAULT: 'hsl(var(--base-color-blue), 63%)',
          hover: 'hsl(var(--base-color-blue), 73%)',
          medium: {
            DEFAULT: 'hsl(var(--base-color-blue), 38%)',
            hover: 'hsl(var(--base-color-blue), 48%)',
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
        },

      }
    },
    fontFamily: {
      body: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
      'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif',
      'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol']
    },
    extend: {},
  },
  plugins: [],
}
