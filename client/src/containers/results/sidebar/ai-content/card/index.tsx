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
        "flex cursor-pointer flex-col rounded-sm border p-4 text-sm transition-all duration-200 hover:border-[1.5px] hover:border-foreground": true,
        "border-foreground": active,
      })}
    >
      <div key={option.value} className="flex items-start space-x-4">
        <RadioGroupItem id={option.value} value={option.value} />
        <div className="flex flex-col">
          <span className="font-bold text-primary">{option.label}</span>
          <p className="font-medium text-foreground">{option.description}</p>
        </div>
      </div>
    </Label>
  );
}
