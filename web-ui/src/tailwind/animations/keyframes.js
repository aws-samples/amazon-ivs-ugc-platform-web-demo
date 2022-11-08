const colors = require('../colors');

module.exports = {
  'marquee-first-part': {
    '0%': { transform: 'translateX(0%)' },
    '100%': { transform: 'translateX(-100%)' }
  },
  'marquee-second-part': {
    '0%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(0%)' }
  },
  'pulse-first-waves-light': {
    '0%': { fill: colors.lightMode.gray.medium.DEFAULT },
    '7%': { fill: colors.lightMode.gray.medium.DEFAULT },
    '21%': { fill: colors.black.DEFAULT },
    '78%': { fill: colors.black.DEFAULT },
    '100%': { fill: colors.lightMode.gray.medium.DEFAULT }
  },
  'pulse-first-waves-dark': {
    '0%': { fill: colors.darkMode.gray.dark.DEFAULT },
    '7%': { fill: colors.darkMode.gray.dark.DEFAULT },
    '21%': { fill: colors.white.DEFAULT },
    '78%': { fill: colors.white.DEFAULT },
    '100%': { fill: colors.darkMode.gray.dark.DEFAULT }
  },
  'pulse-second-waves-light': {
    '0%': { fill: colors.lightMode.gray.medium.DEFAULT },
    '28%': { fill: colors.lightMode.gray.medium.DEFAULT },
    '42%': { fill: colors.black.DEFAULT },
    '78%': { fill: colors.black.DEFAULT },
    '100%': { fill: colors.lightMode.gray.medium.DEFAULT }
  },
  'pulse-second-waves-dark': {
    '0%': { fill: colors.darkMode.gray.dark.DEFAULT },
    '28%': { fill: colors.darkMode.gray.dark.DEFAULT },
    '42%': { fill: colors.white.DEFAULT },
    '78%': { fill: colors.white.DEFAULT },
    '100%': { fill: colors.darkMode.gray.dark.DEFAULT }
  },
  blink: { '50%': { opacity: '0.8' } },
  spinnerStroke: {
    '0%': {
      'stroke-dasharray': '1px, 200px',
      'stroke-dashoffset': '0'
    },
    '50%': {
      'stroke-dasharray': '100px, 200px',
      'stroke-dashoffset': '-15px'
    },
    '100%': {
      'stroke-dasharray': '100px, 200px',
      'stroke-dashoffset': '-125px'
    }
  }
};
