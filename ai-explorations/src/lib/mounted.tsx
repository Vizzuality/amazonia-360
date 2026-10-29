"use client";

import { useLayoutEffect, useState } from "react";

export function useIsMounted(): () => boolean {
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  return () => isMounted;
}

export default useIsMounted;
