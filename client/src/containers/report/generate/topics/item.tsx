"use client";

import { useFormContext } from "react-hook-form";

import Image from "next/image";

import { useLocale } from "next-intl";
import { z } from "zod";

import { PLACEHOLDER } from "@/lib/images";
import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { cn } from "@/lib/utils";

import { Topic } from "@/types/topic";

import { formSchema } from "@/containers/report/generate";
// import SubtopicList from "@/containers/report/generate/subtopics";

import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FormField } from "@/components/ui/form";

export default function TopicsItem({ id, name, image }: Topic) {
  const form = useFormContext<z.infer<typeof formSchema>>();

  const locale = useLocale();
  const { data: subtopicsData } = useGetDefaultSubtopics({ topicId: id, locale });

  return (
    <FormField
      control={form.control}
      name="topics"
      render={({ field }) => {
        return (
          <Collapsible
            open={!!field.value.find((topic) => topic.id === id)}
            onOpenChange={(open) => {
              if (open) {
                field.onChange([
                  ...field.value,
                  {
                    id,
                    subtopics: subtopicsData?.map((subtopic) => subtopic.id) || [],
                  },
                ]);
              }
              if (!open) {
                field.onChange(field.value.filter((topic) => topic.id !== id));
              }
            }}
          >
            <div className="relative">
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
                )}
              >
                <div className={cn("flex items-center space-x-2.5")}>
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xs bg-cyan-100">
                    <Image
                      src={image}
                      alt={`${name}`}
                      priority
                      fill
                      sizes="100%"
                      placeholder={PLACEHOLDER(80, 80)}
                      className={cn({
                        "object-cover": true,
                      })}
                    />
                  </div>
                  <div className="flex flex-col items-start justify-start space-y-1 pr-8">
                    <span className="text-left text-base font-bold transition-none">{name}</span>
                  </div>
                </div>
              </CollapsibleTrigger>

              <div className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2">
                <Checkbox
                  className="block"
                  checked={!!field.value.find((topic) => topic.id === id)}
                  semichecked={
                    !!field.value.find(
                      (topic) =>
                        topic.id === id && topic.subtopics?.length !== subtopicsData?.length,
                    )
                  }
                />
              </div>
            </div>
            {/* <CollapsibleContent className="pl-6">
              <SubtopicList topicId={id} />
            </CollapsibleContent> */}
          </Collapsible>
        );
      }}
    />
  );
}
