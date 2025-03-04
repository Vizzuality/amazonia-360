"use client";

import { cn } from "@/lib/utils";

import { useSyncAiSummary } from "@/app/store";

import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

export default function AiSidebarContentCard({
  option,
}: {
  option: { value: string; label: string; description: string };
}) {
  const [ai_summary] = useSyncAiSummary();

  return (
    <div
      className={cn({
        "flex flex-col space-y-1 rounded-sm border p-4 text-sm": true,
        "border-foreground": ai_summary.type === option.value,
      })}
    >
      <div key={option.value} className="flex items-center space-x-4 text-foreground">
        <RadioGroupItem value={option.value} />
        <Label className="font-bold">{option.label}</Label>
      </div>
      <p className="font-medium text-muted-foreground">{option.description}</p>
    </div>
  );
}
