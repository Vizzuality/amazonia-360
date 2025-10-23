import { useEffect } from "react";

import { scroller } from "react-scroll";

import { usePrevious } from "@dnd-kit/utilities";

/**
 * Triggers scroll and animation for updated indicators when INDICATORS changes.
 * @param INDICATORS The current array of indicator DOM elements
 * @param disabled If true, disables the highlighting functionality
 * @returns void
 */
export function useHighlightNewIndicator(
  INDICATORS: (React.JSX.Element | undefined)[] | undefined,
  disabled?: boolean,
) {
  const PREVIOUS_INDICATORS = usePrevious(INDICATORS);

  useEffect(() => {
    if (disabled) return;
    // Don't run on server
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (!INDICATORS || !INDICATORS.length) return;

    // Find new indicators by comparing with previous
    const prevIds = new Set(PREVIOUS_INDICATORS?.map((el) => el?.props.id) || []);

    INDICATORS.forEach((element) => {
      const id = element?.props.id || "";
      if (!prevIds.has(id)) {
        const el = document.getElementById(id);
        const outlineEl = document.getElementById(`${id}-outline`);

        if (!el || !outlineEl) return;

        scroller.scrollTo(id, {
          duration: 500,
          delay: 0,
          smooth: "easeInOutQuart",
          offset: -200,
        });

        outlineEl.dataset.status = "active";

        setTimeout(() => {
          outlineEl.dataset.status = "inactive";
        }, 4000);
      }
    });
  }, [INDICATORS, PREVIOUS_INDICATORS, disabled]);
}
