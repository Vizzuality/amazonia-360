"use client";

import { Topic } from "@/app/local-api/topics/route";
import { useSyncTopics } from "@/app/store";

export function CounterIndicatorsPill({ id }: { id: Topic["id"] }) {
  const [topics] = useSyncTopics();
  const t = topics?.find((t) => t.id === id);

  if (!t || !t.indicators || !t.indicators?.length) return null;

  return (
    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary">
      {t.indicators.length}
    </span>
  );
}
