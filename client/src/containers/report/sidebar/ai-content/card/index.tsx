"use client";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";

export default function AiSidebarContentCard({
  option,
  active,
}: {
  option: { value: string; label: string; description: string };
  active: boolean;
}) {
  return (
    <Label
      htmlFor={option.value}
      className={cn({
        "flex cursor-pointer flex-col space-y-1 rounded-sm border p-4 text-sm transition-all duration-200 hover:border-[1.5px] hover:border-foreground":
          true,
        "border-foreground": active,
      })}
    >
      <div key={option.value} className="flex items-center space-x-4 text-foreground">
        <RadioGroupItem id={option.value} value={option.value} />
        <span className="font-bold">{option.label}</span>
      </div>
      <p className="font-medium text-muted-foreground">{option.description}</p>
    </Label>
  );
}
