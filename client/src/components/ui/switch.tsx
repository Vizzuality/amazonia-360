"use client";

import * as React from "react";

import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function SwitchThumb() {
  return (
    <SwitchPrimitives.Thumb
      className={cn(
        "bg-background pointer-events-none z-10 block h-3 w-3 rounded-full shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
      )}
    />
  );
}

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root
      data-slot="switch"
      className={cn(
        "peer focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-blue-100",
        className,
      )}
      {...props}
    >
      <span className="absolute -top-0.5 -left-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] rounded-full bg-black/10"></span>
      <SwitchThumb />
    </SwitchPrimitives.Root>
  );
}

export { Switch, SwitchThumb };
