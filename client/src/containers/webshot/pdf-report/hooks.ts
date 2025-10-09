import { useEffect } from "react";

import { atom, useAtom } from "jotai";

// Holds all active page IDs in mount order
const pagesAtom = atom<string[]>([]);

export function useRegisterPage(id: string) {
  const [pages, setPages] = useAtom(pagesAtom);

  useEffect(() => {
    // Add page on mount
    setPages((prev) => [...prev, id]);

    // Remove page on unmount
    return () => {
      setPages((prev) => prev.filter((p) => p !== id));
    };
  }, [id, setPages]);

  // Find my index (1-based)
  const myIndex = pages.indexOf(id) + 1;
  const total = pages.length;

  return { currentPage: myIndex, totalPages: total };
}
