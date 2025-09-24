import { useEffect, useMemo, useRef, useState } from "react";

interface UseDocumentPagesOptions {
  pageHeight?: number;
}

export function useDocumentPages({
  pageHeight = 793.92, // A4 size in pixels at 96 DPI
}: UseDocumentPagesOptions = {}) {
  const documentRef = useRef<HTMLElement>(null);
  const [documentHeight, setDocumentHeight] = useState(0);
  const lastHeightRef = useRef(0);

  useEffect(() => {
    if (!documentRef.current) return;

    const updateHeight = () => {
      if (documentRef.current) {
        const newHeight = documentRef.current.scrollHeight;
        if (newHeight !== lastHeightRef.current) {
          lastHeightRef.current = newHeight;
          setDocumentHeight(newHeight);
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(updateHeight);
    });

    resizeObserver.observe(documentRef.current);
    mutationObserver.observe(documentRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      characterDataOldValue: true,
    });

    updateHeight();

    const intervalId = setInterval(updateHeight, 500);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  const totalPages = useMemo(() => {
    if (documentHeight === 0) return 0;
    return Math.ceil(documentHeight / pageHeight);
  }, [documentHeight, pageHeight]);

  // Calculate current page based on element position - make it a callback that's always fresh
  const getCurrentPage = useMemo(() => {
    return (element?: HTMLElement) => {
      if (!element || !documentRef.current || documentHeight === 0) return 1;

      const elementTop = element.offsetTop;
      const currentPage = Math.floor(elementTop / pageHeight) + 1;
      const maxPages = Math.ceil(documentHeight / pageHeight);
      return Math.min(currentPage, Math.max(maxPages, 1));
    };
  }, [documentHeight, pageHeight]);

  return {
    documentRef,
    totalPages,
    getCurrentPage,
    documentHeight,
  };
}
