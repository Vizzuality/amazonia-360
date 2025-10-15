"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import PrintButton from "@/containers/webshot/pdf-report/button";
import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfCover from "@/containers/webshot/pdf-report/cover";
import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import PdfTopics from "@/containers/webshot/pdf-report/topics";

export const Pdf = () => {
  const ref = useRef<HTMLDivElement>(null);

  return (
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
  );
};

export default Pdf;
