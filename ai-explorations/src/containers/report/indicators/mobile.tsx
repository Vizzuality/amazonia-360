"use client";

import ReportIndicatorsContent from "@/containers/report/indicators/content";

export default function ReportIndicatorsMobile() {
  return (
    <div className="container grid grid-cols-12">
      <div className="col-span-12">
        <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
          <div className="flex max-h-[calc(100vh-(64px+40px+28px))] grow flex-col">
            <div className="relative flex max-h-full grow flex-col overflow-hidden">
              <ReportIndicatorsContent />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
