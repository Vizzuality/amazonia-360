"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { LoadProvider } from "@/containers/indicators/load-provider";
import PrintButton from "@/containers/webshot/pdf-report/button";
import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfCover from "@/containers/webshot/pdf-report/cover";
import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import PdfTopics from "@/containers/webshot/pdf-report/topics";

export const Pdf = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <LoadProvider onLoad={handleLoad}>
      {!loaded && (
        <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-foreground/80 text-background">
          <p className="text-xl font-bold">Generating report...</p>
        </div>
      )}
      <div
        className={cn({
          relative: true,
          "space-y-5 py-10 print:space-y-0 print:py-0": true,
        })}
        ref={ref}
      >
        <PdfContainer index={0}>
          <PdfCover />
        </PdfContainer>

        <PdfContainer>
          <PfdGeographicContext />
        </PdfContainer>

        <PdfTopics />

        <PrintButton
          onClick={() => {
            window.print();
          }}
        />
      </div>
    </LoadProvider>
  );
};

export default Pdf;
