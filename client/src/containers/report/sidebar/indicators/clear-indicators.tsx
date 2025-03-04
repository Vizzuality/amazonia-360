import { useCallback, useMemo } from "react";

import { useGetDefaultTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

export default function SidebarClearIndicators() {
  const [topics, setTopics] = useSyncTopics();

  const { data: defaultTopics } = useGetDefaultTopics();

  const defaultIndicators = useMemo(
    () =>
      defaultTopics?.map((topic) => ({
        id: topic.id,
        indicators: topic?.default_visualization,
      })),
    [defaultTopics],
  );

  const indicatorCount =
    topics?.flatMap((topic) => topic.indicators?.map((indicator) => indicator.id))?.length || 0;

  const handleClick = useCallback(() => {
    if (!!topics?.length) {
      setTopics([]);
      return;
    }
    if (!!defaultIndicators) setTopics(defaultIndicators);
  }, [setTopics, topics, defaultIndicators]);

  return (
    <button
      type="button"
      className={cn({
        "cursor-pointer space-x-1 whitespace-nowrap text-end text-xs font-semibold text-primary transition-colors duration-500 ease-linear hover:underline":
          true,
      })}
      onClick={handleClick}
    >
      <span>{!!topics?.length && topics?.length > 0 ? "Clear all" : "Select all"}</span>
      {!!topics?.length && <span>({indicatorCount})</span>}
    </button>
  );
}
