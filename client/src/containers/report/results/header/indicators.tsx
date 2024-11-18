"use client";

import { useAtom } from "jotai";
import { RxPencil1 } from "react-icons/rx";

import { reportEditionModeAtom } from "@/app/store";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function IndicatorsReport() {
  const { toggleSidebar } = useSidebar();
  const [reportEditionMode, setReportEditionMode] = useAtom(reportEditionModeAtom);

  return (
    <Button
      className="space-x-2 hover:bg-primary/20"
      onClick={() => {
        toggleSidebar();
        setReportEditionMode(!reportEditionMode);
      }}
      variant="outline"
    >
      <RxPencil1 className="h-5 w-5" />
      <span>Report settings</span>
    </Button>
  );
}
