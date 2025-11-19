"use client";

import { useRef, useState } from "react";

import { useParams } from "next/navigation";

import { useHydrateAtoms } from "jotai/utils";
import { useTranslations } from "next-intl";

import { useReport } from "@/lib/report";
import { cn } from "@/lib/utils";

import { locationAtom, titleAtom, topicsViewAtom } from "@/app/(frontend)/store";

import { LoadProvider } from "@/containers/indicators/load-provider";
import PrintButton from "@/containers/webshot/pdf-report/button";
import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfCover from "@/containers/webshot/pdf-report/cover";
import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import PdfTopics from "@/containers/webshot/pdf-report/topics";

export const Pdf = () => {
  const t = useTranslations();

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: Number(reportId) });

  // Use separate calls to avoid type conflicts between different atom types
  useHydrateAtoms(new Map([[topicsViewAtom, reportData?.topics]]));
  useHydrateAtoms(new Map([[titleAtom, reportData?.title]]));
  useHydrateAtoms(new Map([[locationAtom, reportData?.location]]));

  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <LoadProvider onLoad={handleLoad}>
      {!loaded && (
        <div className="fixed left-0 top-0 z-50 flex h-full w-full flex-col items-center justify-center bg-foreground/90 text-background">
          <div className="flex max-w-sm flex-col items-center justify-center gap-2 text-center">
            <h3 className="text-xl font-bold">{t("pdf-report-generating")}</h3>
            <p className="text-sm">{t("pdf-report-generating-subtitle")}</p>
          </div>
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
