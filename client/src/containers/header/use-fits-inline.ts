import { RefObject, useEffect, useRef, useState } from "react";

interface UseFitsInlineOptions {
  rowRef: RefObject<HTMLElement | null>;
  linksRef: RefObject<HTMLElement | null>;
  fallbackRef: RefObject<HTMLElement | null>;
  resetKey: string;
}

function getPixels(value: string): number {
  return Number.parseFloat(value) || 0;
}

function getContentWidth(element: Element): number {
  const range = document.createRange();
  range.selectNodeContents(element);
  return Math.ceil(range.getBoundingClientRect().width);
}

function getFreeSpace(row: HTMLElement): number {
  const grower = Array.from(row.children).find(
    (child) => getPixels(getComputedStyle(child).flexGrow) > 0,
  );
  if (!grower) return 0;

  return grower.clientWidth - getContentWidth(grower);
}

function getFootprint(element: HTMLElement, row: HTMLElement): number {
  let gap = 0;
  for (let parent = element.parentElement; parent && parent !== row && !gap; ) {
    gap = getPixels(getComputedStyle(parent).columnGap);
    parent = parent.parentElement;
  }
  return element.offsetWidth + gap;
}

export function useFitsInline({
  rowRef,
  linksRef,
  fallbackRef,
  resetKey,
}: UseFitsInlineOptions): boolean {
  const [collapsedFor, setCollapsedFor] = useState<string | null>(null);
  const footprintRef = useRef<{ key: string; width: number } | null>(null);

  const fitsInline = collapsedFor !== resetKey;

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const measure = () => {
      const freeSpace = getFreeSpace(row);
      const links = linksRef.current;

      if (links && links.offsetWidth > 0) {
        footprintRef.current = { key: resetKey, width: getFootprint(links, row) };
        if (freeSpace < 0 || row.scrollWidth > row.clientWidth) setCollapsedFor(resetKey);
        return;
      }

      const footprint = footprintRef.current;
      const fallback = fallbackRef.current;
      if (links || !fallback || footprint?.key !== resetKey) return;

      if (freeSpace + getFootprint(fallback, row) >= footprint.width) setCollapsedFor(null);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(row);
    Array.from(row.children).forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, [rowRef, linksRef, fallbackRef, resetKey]);

  return fitsInline;
}
