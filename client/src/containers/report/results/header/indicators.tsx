"use client";

import { useSetAtom } from "jotai";
import { RxPencil1 } from "react-icons/rx";

import { reportEditionModeAtom } from "@/app/store";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function IndicatorsReport() {
  const { toggleSidebar } = useSidebar();
  const setReportEditionMode = useSetAtom(reportEditionModeAtom);

  return (
    <Button
      className="space-x-2"
      onClick={() => {
        setReportEditionMode(true);
        toggleSidebar();
      }}
      variant="outline"
    >
      <RxPencil1 className="h-5 w-5" />
      <span>Indicators</span>
    </Button>
  );
}
