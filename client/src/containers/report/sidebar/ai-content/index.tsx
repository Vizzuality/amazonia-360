"use client";

import { useSyncAiSummary } from "@/app/store";

import { RadioGroup } from "@/components/ui/radio-group";

import AiSidebarContentCard from "./card";

const AUDIENCES = [
  {
    value: "general",
    label: "General Public",
    description: "Simplified information for easy understanding.",
  },
  {
    value: "finance",
    label: "Finance professionals",
    description: "Lorem ipsum dolor sit amet consectetur. Risus etiam viverra.",
  },
  {
    value: "conservationist",
    label: "Conservationist",
    description: "Lorem ipsum dolor sit amet consectetur. Risus etiam viverra.",
  },
];
export default function AiSidebarContent() {
  const [ai_summary, setAiSummary] = useSyncAiSummary();

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-1 grow flex-col justify-between">
      <div className="w-full space-y-6">
        <p className="font-medium leading-5 text-muted-foreground">
          Select your target audience to generate descriptive summaries for each of the active
          topics in your report.
        </p>
        <RadioGroup
          defaultValue="general"
          className="flex flex-col gap-1.5"
          onValueChange={(value) =>
            setAiSummary({
              ...ai_summary,
              type: value as "general" | "finance" | "conservationist",
            })
          }
        >
          {AUDIENCES.map((option) => (
            <AiSidebarContentCard key={option.value} option={option} />
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
