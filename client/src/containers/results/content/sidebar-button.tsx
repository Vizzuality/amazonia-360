"use client";

import { LuPlus } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function ReportResultsContentSidebarButton() {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="container w-full print:hidden">
      <Button
        className="flex w-full space-x-2.5 py-5"
        onClick={() => toggleSidebar()}
        variant="outline"
      >
        <LuPlus className="flex h-4 w-4 justify-center rounded-full border-[1.5px] border-blue-700 text-blue-700" />
        <span className="text-sm font-semibold">Indicators</span>
      </Button>
    </div>
  );
}
