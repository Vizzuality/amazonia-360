import { useLayoutEffect, useRef } from "react";
import { scroller } from "react-scroll";
import { usePrevious } from "@dnd-kit/utilities";


/**
 * Triggers scroll and animation for updated indicators when INDICATORS changes.
 * @param editable Whether the indicators are editable. They are not default indicators then.
 * @param INDICATORS The current array of indicator DOM elements
 */
export function useHighlightNewIndicator(
  editable: boolean,
  INDICATORS: JSX.Element[] | undefined,
) {
  const PREVIOUS_INDICATORS = usePrevious(INDICATORS);
  const hasMounted = useRef(false);
  useLayoutEffect(() => {
    // If default indicator, do nothing
    if (!editable) return;
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (!INDICATORS || !INDICATORS.length) return;

    // Find new indicators by comparing with previous
    const prevIds = new Set(
      PREVIOUS_INDICATORS?.map((el) => el?.props.id) || []
    );

    INDICATORS.forEach((element) => {
      const id = element?.props.id || "";
      if (!prevIds.has(id)) {
        const el = document.getElementById(id);
        if (!el) return;
        let timeoutId: NodeJS.Timeout | null = null;
        scroller.scrollTo(id, {
          duration: 500,
          delay: 0,
          smooth: "easeInOutQuart",
          offset: -200,
        });
        timeoutId = setTimeout(() => {
          el.classList.add("animate-outline-in");
        }, 100);
        el.addEventListener("animationend", () => {
          el.classList.remove("animate-outline-in");
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        });
      }
    });
  }, [editable, INDICATORS, PREVIOUS_INDICATORS]);
}
