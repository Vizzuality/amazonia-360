"use client";

import { useFormContext } from "react-hook-form";

import { z } from "zod";

import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { formSchema } from "@/containers/report/generate";

import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form";

export default function SubtopicsItem({ id, name }: Subtopic) {
  const form = useFormContext<z.infer<typeof formSchema>>();
  return (
    <FormField
      control={form.control}
      name="topics"
      render={({ field }) => (
        <div
          className={cn(
            "relative h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
          )}
        >
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
            )}
            onClick={() => {
              const s = field?.value
                ?.find((topic) => topic?.subtopics?.find((subtopic) => subtopic.id === id))
                ?.subtopics?.find((subtopic) => subtopic.id === id);

              if (s) {
                // Remove subtopic
                field.onChange(
                  field.value.map((topic) => {
                    if (topic?.subtopics?.find((subtopic) => subtopic.id === id)) {
                      return {
                        ...topic,
                        subtopics: topic.subtopics.filter((subtopic) => subtopic.id !== id),
                      };
                    }
                    return topic;
                  }),
                );
              } else {
                // Add subtopic
                field.onChange(
                  field.value.map((topic) => {
                    return {
                      ...topic,
                      subtopics: [...(topic?.subtopics || []), { id }],
                    };
                  }),
                );
              }
            }}
          >
            <div className={cn("flex items-center space-x-2.5")}>
              <div className="flex flex-col items-start justify-start space-y-1">
                <span className="text-sm font-medium transition-none">{name}</span>
              </div>
            </div>
          </button>
          <div className="pointer-events-none absolute right-1 top-1">
            <Checkbox
              className="block"
              checked={
                !!field?.value?.find((topic) =>
                  topic?.subtopics?.find((subtopic) => subtopic.id === id),
                )
              }
            />
          </div>
        </div>
      )}
    />
  );
}
