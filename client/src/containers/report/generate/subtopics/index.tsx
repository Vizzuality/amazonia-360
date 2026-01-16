"use client";

import { useLocale } from "next-intl";

import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import SubtopicItem from "./item";

export default function SubtopicList({ topicId }: { topicId?: Topic["id"] }) {
  const locale = useLocale();

  const { data: subtopicData } = useGetDefaultSubtopics({ topicId, locale });

  return (
    <div
      className={cn(
        "relative",
        "before:pointer-events-none before:absolute before:left-0 before:top-0 before:h-[calc(100%_-_theme(space.5))] before:w-5 before:rounded-b-3xl before:border-b-2 before:border-l-2 before:border-blue-100/40",
        "after:pointer-events-none after:absolute after:left-2.5 after:top-0 after:z-0 after:h-[calc(100%_-_theme(space.5))] after:w-2.5 after:bg-white",
      )}
    >
      <div className="relative z-10 flex flex-col gap-0.5 p-2 pl-6 pr-0">
        {subtopicData?.map((subtopic) => {
          return <SubtopicItem key={subtopic.id} {...subtopic} />;
        })}
      </div>
    </div>
  );
}
