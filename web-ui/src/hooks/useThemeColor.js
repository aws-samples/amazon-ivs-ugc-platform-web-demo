import { useEffect } from 'react';

const useThemeColor = (color) => {
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      .setAttribute('content', color);
  }, [color]);
};

export default useThemeColor;
