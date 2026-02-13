"use client";

import * as React from "react";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { LuCheck, LuMinus } from "react-icons/lu";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  semichecked,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & { semichecked?: boolean }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-primary focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4 shrink-0 border shadow focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
        {!semichecked && <LuCheck className="h-4 w-4" />}
        {semichecked && <LuMinus className="h-4 w-4" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
