import { useState, useEffect, useCallback } from 'react';

const useStickyScroll = (targetRef, data, stickyTolerance = 5) => {
  const [isSticky, setIsSticky] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (targetRef.current) {
      targetRef.current.scrollTop = targetRef.current.scrollHeight;
    }
  }, [targetRef]);

  useEffect(() => {
    if (isSticky) scrollToBottom();
  }, [scrollToBottom, isSticky, data.length]);

  useEffect(() => {
    const el = targetRef.current;
    const updateStuckToBottom = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const { scrollHeight, clientHeight, scrollTop } = targetRef.current;
      const isStuckToBottom =
        scrollHeight - scrollTop - clientHeight <= stickyTolerance;
      setIsSticky(isStuckToBottom);
    };

    el.addEventListener('scroll', updateStuckToBottom, { passive: false });

    return () => el.removeEventListener('scroll', updateStuckToBottom);
  }, [stickyTolerance, targetRef]);

  return { isSticky, scrollToBottom };
};

export default useStickyScroll;
