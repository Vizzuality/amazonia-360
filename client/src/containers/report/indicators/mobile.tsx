"use client";

import { ScrollArea } from "@radix-ui/react-scroll-area";

import IndicatorsList from "@/containers/indicators/list";

export default function ReportIndicatorsMobile() {
  return (
    <>
      <div className="container grid grid-cols-12">
        <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
          <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
            <div className="flex max-h-[calc(100vh_-_(64px_+_40px_+_28px))] grow flex-col">
              <div className="flex max-h-full grow flex-col overflow-hidden">
                <ScrollArea className="h-full w-full grow">
                  <IndicatorsList />
                </ScrollArea>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
