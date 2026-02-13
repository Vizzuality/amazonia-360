"use client";

import ReportIndicatorsContent from "@/containers/report/indicators/content";

export default function ReportIndicatorsDesktop() {
  return (
    <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
      <div className="flex max-h-[calc(100vh_-_(calc(var(--spacing)*16)_+_calc(var(--spacing)*20)))] grow flex-col">
        <div className="relative flex max-h-full grow flex-col overflow-hidden">
          <ReportIndicatorsContent />
        </div>
      </div>
    </aside>
  );
}
