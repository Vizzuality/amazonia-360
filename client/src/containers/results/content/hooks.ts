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
  INDICATORS: JSX.Element[] | undefined,
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
        if (!el) return;

        let animationTimeoutId: NodeJS.Timeout | null = null;

        scroller.scrollTo(id, {
          duration: 500,
          delay: 0,
          smooth: "easeInOutQuart",
          offset: -200,
        });

        animationTimeoutId = setTimeout(() => {
          el.classList.add("animate-outline-in");
        }, 100);

        const onAnimationEnd = () => {
          el.classList.remove("animate-outline-in");
          if (animationTimeoutId) {
            clearTimeout(animationTimeoutId);
          }
          el.removeEventListener("animationend", onAnimationEnd);
        };

        el.addEventListener("animationend", onAnimationEnd);
      }
    });
  }, [INDICATORS, PREVIOUS_INDICATORS, disabled]);
}
