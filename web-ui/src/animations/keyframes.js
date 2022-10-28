module.exports = {
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
