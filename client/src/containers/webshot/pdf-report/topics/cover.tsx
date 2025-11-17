"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { useSyncTopics } from "@/app/(frontend)/store";

import { Markdown } from "@/components/ui/markdown";

export default function PdfTopicCover(topic: Topic) {
  const { name, description, image } = topic;

  const [topics] = useSyncTopics();

  const TOPIC = useMemo(() => topics?.find((t) => t.id === topic.id), [topic.id, topics]);

  return (
    <div className="flex w-full grow flex-col overflow-hidden">
      <div
        className="grow bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="flex h-full flex-col justify-end bg-gradient-to-t from-black to-transparent">
          <div className="flex flex-col gap-2 px-14 pb-20 text-white">
            <h1 className="text-5xl">{name}</h1>
            {description && <p className="ml-2">{description}</p>}
          </div>
        </div>
      </div>

      {TOPIC?.description && (
        <section className="px-14 py-10">
          <Markdown
            className={cn("prose prose-sm max-w-none columns-2 gap-x-8", {
              "prose-p:text-xs prose-p:leading-normal": true,
            })}
          >
            {TOPIC?.description}
          </Markdown>
        </section>
      )}
    </div>
  );
}
