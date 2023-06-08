import { useEffect, useRef, useState } from 'react';

const useStringOverflow = (value) => {
  const strRef = useRef();
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (!strRef.current) return;

    const updateOverflow = () => {
      if (strRef.current) {
        const { offsetWidth, scrollWidth } = strRef.current;

        setIsOverflowing(offsetWidth < scrollWidth);
      }
    };

    window.addEventListener('resize', updateOverflow);
    updateOverflow();

    return () => window.removeEventListener('resize', updateOverflow);
  }, [value]);

  return [isOverflowing, strRef];
};

export default useStringOverflow;
