import { useCallback } from "react";

import { cn } from "@/lib/utils";

import { useSyncTopics } from "@/app/store";

export default function SidebarClearIndicators() {
  const [topics, setTopics] = useSyncTopics();

  const indicatorCount =
    topics?.flatMap((topic) => topic.indicators?.map((indicator) => indicator.id))?.length || 0;

  const handleClick = useCallback(() => {
    setTopics([]);
  }, [setTopics]);

  return (
    <button
      type="button"
      disabled={indicatorCount === 0}
      className={cn({
        "space-x-1 whitespace-nowrap text-end text-xs font-semibold text-primary transition-colors duration-500 ease-linear":
          true,
        "cursor-pointer hover:underline": indicatorCount > 0,
      })}
      onClick={handleClick}
    >
      <span>Clear selection</span>
      <span>({indicatorCount})</span>
    </button>
  );
}
