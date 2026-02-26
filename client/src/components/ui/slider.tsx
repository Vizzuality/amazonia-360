"use client";

import * as React from "react";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex w-full touch-none items-center select-none", className)}
      {...props}
    >
      <SliderPrimitive.Track className="bg-primary/20 relative h-0.5 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-primary absolute h-full" />
      </SliderPrimitive.Track>
      {Array.from(Array(props.value?.length || props.defaultValue?.length || 0).keys()).map(
        (key) => (
          <SliderPrimitive.Thumb
            key={key}
            className="border-primary/50 bg-background focus-visible:ring-ring block h-3 w-3 cursor-pointer rounded-full border shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          />
        ),
      )}
    </SliderPrimitive.Root>
  );
}

export { Slider };
