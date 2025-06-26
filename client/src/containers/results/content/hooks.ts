import { useLayoutEffect, useRef } from "react";

import { TopicView, IndicatorView } from "@/app/parsers";

/**
 * Triggers scroll and animation for updated indicators when topic.indicators changes.
 * @param topic The current topic object
 * @param previousTopic The previous topic object
 * @param editable Whether the indicators are editable. They are not default indicators then.
 */
export function useHighlightNewIndicator(
  topic: TopicView,
  previousTopic: TopicView | undefined,
  editable: boolean,
) {
  const hasMounted = useRef(false);

  useLayoutEffect(() => {
    // The default indicators are not editable
    if (!editable) return;

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    if (!topic.indicators || previousTopic?.indicators?.length === topic.indicators.length) return;
    const isUpdated = (indicator: IndicatorView) => {
      const previousIndicators = previousTopic?.indicators;
      if (!previousIndicators || !previousIndicators.length) return true;
      const prevIndicator = previousIndicators.find(
        (prev) => prev.id === indicator.id && prev.type === indicator.type,
      );
      return !prevIndicator;
    };

    topic?.indicators.forEach((indicator) => {
      if (isUpdated(indicator)) {
        const el = document.getElementById(`widget-${indicator.id}-${indicator.type}`);
        let timeoutId: NodeJS.Timeout | null = null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
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
      }
    });
  }, [previousTopic, topic, editable]);
}
