"use client";

import * as React from "react";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tabsTriggerVariants = cva("inline-flex items-center justify-center whitespace-nowrap", {
  variants: {
    variant: {
      default:
        "border-b-[3px] border-transparent p-2 text-xs text-blue-200 ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-blue-500 data-[state=active]:text-blue-500",
      primary:
        "p-2 rounded text-xs text-muted-foreground ring-offset-background transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-blue-500 data-[state=active]:text-white",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const Tabs = TabsPrimitive.Root;

export interface TabsTriggerProps
  extends React.ComponentProps<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex items-center justify-center space-x-4 print:bg-white",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, variant, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant, className }))}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "ring-offset-background focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
