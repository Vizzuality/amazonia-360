"use client";

import { ScrollArea } from "@radix-ui/react-scroll-area";

import ReportIndicatorsContent from "@/containers/report/indicators/content";

export default function ReportIndicatorsDesktop() {
  return (
    <>
      <div className="pointer-events-none z-10 w-full lg:absolute lg:bottom-8 lg:left-0 lg:top-10">
        <div className="container grid grid-cols-12">
          <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
            <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
              <div className="flex h-min max-h-[calc(100vh_-_(64px_+_40px_+_28px))] flex-col">
                <div className="flex max-h-full grow flex-col overflow-hidden">
                  <ScrollArea className="h-full w-full grow">
                    <ReportIndicatorsContent />
                  </ScrollArea>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
