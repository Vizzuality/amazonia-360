"use client";

import { useRef } from "react";

import html2pdf from "html2pdf.js";

import PrintButton from "@/containers/webshot/pdf-report/button";
import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfCover from "@/containers/webshot/pdf-report/cover";
import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import PdfTopics from "@/containers/webshot/pdf-report/topics";

interface Html2PdfOptions {
  margin?: number | [number, number] | [number, number, number, number];
  filename?: string;
  image?: {
    type?: "jpeg" | "png" | "webp";
    quality?: number;
  };
  enableLinks?: boolean;
  html2canvas?: object;
  jsPDF?: {
    unit?: string;
    format?: string | [number, number];
    orientation?: "portrait" | "landscape";
  };
}

export const Pdf = () => {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={ref}>
      <PdfContainer index={0}>
        <PdfCover />
      </PdfContainer>

      <PdfContainer>
        <PfdGeographicContext />
      </PdfContainer>

      <PdfTopics />

      <PrintButton
        onClick={() => {
          const content = ref.current;
          if (!content) return;

          const options: Html2PdfOptions = {
            margin: 0,
            filename: "report.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
          };

          html2pdf().set(options).from(content).save();
        }}
      />
    </div>
  );
};

export default Pdf;
