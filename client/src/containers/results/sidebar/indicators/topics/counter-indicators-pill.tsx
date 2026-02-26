"use client";

import { Topic } from "@/types/topic";

import { useFormTopics } from "@/app/(frontend)/store";

export function CounterIndicatorsPill({ id }: { id: Topic["id"] }) {
  const { topics } = useFormTopics();
  const t = topics?.find((t) => t.topic_id === id);

  if (!t || !t.indicators || !t.indicators?.length) return null;

  return (
    <span className="bg-secondary text-primary rounded-full px-2.5 py-0.5 text-xs font-semibold">
      {t.indicators.length}
    </span>
  );
}
