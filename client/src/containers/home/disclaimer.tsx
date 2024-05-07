"use client";

import { useState } from "react";

import { LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

export default function HomeDisclaimer() {
  const [open, setOpen] = useState(true);

  return (
    <div
      className={cn({
        "bg-gray-300 py-4 sticky top-0 z-20": true,
        hidden: !open,
      })}
    >
      <div className="container">
        <div className="flex space-x-2">
          <p className="font-medium text-sm">
            This website is a prototype of Amazonia360, designed to facilitate
            co-creation with select users. The contents and data are for
            demonstration purposes only and have not been fully validated yet.
            Please refrain from sharing this link, as the functionalities
            presented are intended for demonstration and testing purposes only.
          </p>

          <Button
            size="icon"
            variant="ghost"
            className="shrink-0 rounded-full"
            onClick={() => setOpen(false)}
          >
            <LuX className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
