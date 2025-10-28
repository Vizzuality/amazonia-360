"use client";

import { useLocale } from "next-intl";
import { useLocalstorageState } from "rooks";

import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { useSyncAiSummary } from "@/app/store";

import { Markdown } from "@/components/ui/markdown";

export default function PdfTopicCover(topic: Topic) {
  const locale = useLocale();
  const { name, description, image } = topic;

  const [ai_summary] = useSyncAiSummary();

  const [summary] = useLocalstorageState<string | null>(`ai-summary-${topic?.id}-${locale}`, null);

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

      {ai_summary.enabled && summary && (
        <section className="px-14 py-10">
          <Markdown
            className={cn("prose-sm max-w-none columns-2 gap-x-8", {
              "prose-p:text-xs prose-p:leading-normal": ai_summary.type === "Long",
            })}
          >
            {summary}
          </Markdown>
        </section>
      )}
    </div>
  );
}
