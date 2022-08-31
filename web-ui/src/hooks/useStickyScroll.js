import { useState, useEffect, useCallback } from 'react';

const useStickyScroll = (targetRef, bottomRef, data, stickyTolerance = 5) => {
  const [isSticky, setIsSticky] = useState(true);

  const scrollToBottom = useCallback(() => {
    targetRef.current.scrollTop = targetRef.current.scrollHeight;

    // On mobile browsers, scrolling the bottomRef into view after
    // setting scrollTop ensures that we scroll to the bottom even
    // when we manually trigger scrollToBottom while scrolling
    // (i.e. when pressing a "new messages" button while scrolling)
    setTimeout(() => bottomRef.current?.scrollIntoView(false), 10);
  }, [bottomRef, targetRef]);

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
