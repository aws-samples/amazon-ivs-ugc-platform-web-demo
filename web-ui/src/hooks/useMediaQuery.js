import { useEffect, useRef, useState } from 'react';
import { isiOS } from '../utils';

const useMediaQuery = (query) => {
  const mediaRef = useRef(window.matchMedia(query));
  const [matches, setMatches] = useState(mediaRef.current.matches);

  useEffect(() => {
    const media = mediaRef.current;
    const listener = () => setMatches(media.matches);

    if (isiOS() && media.addListener) {
      media.addListener(listener);
    } else {
      media.addEventListener('change', listener);
    }

    return () => {
      if (isiOS() && media.removeListener) {
        media.removeListener(listener);
      } else {
        media.removeEventListener('change', listener);
      }
    };
  }, [matches, query]);

  return matches;
};

export default useMediaQuery;
