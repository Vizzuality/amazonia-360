"use client";

import { useRef, useState } from "react";

import { FormProvider, useForm } from "react-hook-form";

import { useHydrateAtoms } from "jotai/utils";
import { useTranslations } from "use-intl";

import { useParams } from "@/lib/navigation";
import { useReport } from "@/lib/report";
import { locationAtom } from "@/lib/url-state/store";
import { cn } from "@/lib/utils";

import { LoadProvider } from "@/containers/indicators/load-provider";
import { ReportFormData } from "@/containers/results";
import PrintButton from "@/containers/webshot/pdf-report/button";
import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfCover from "@/containers/webshot/pdf-report/cover";
import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import { PdfOutro } from "@/containers/webshot/pdf-report/outro";
import PdfTopics from "@/containers/webshot/pdf-report/topics";

export const Pdf = () => {
  const t = useTranslations();

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });

  const methods = useForm<ReportFormData>({
    values: {
      title: reportData?.title,
      description: reportData?.description,
      topics: reportData?.topics,
      location: reportData?.location,
    },
  });

  // Hydrate atoms on initial mount
  useHydrateAtoms(new Map([[locationAtom, reportData?.location]]));

  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
  };

  return (
    <FormProvider {...methods}>
      <LoadProvider onLoad={handleLoad}>
        {!loaded && (
          <div className="fixed top-0 left-0 z-50 flex h-full w-full flex-col items-center justify-center bg-foreground/90 text-background">
            <div className="flex max-w-sm flex-col items-center justify-center gap-2 text-center">
              <h3 className="text-xl font-bold">{t("pdf-report-generating")}</h3>
              <p className="text-sm">{t("pdf-report-generating-subtitle")}</p>
            </div>
          </div>
        )}
        <div
          className={cn({
            relative: true,
            "space-y-5 pb-10 print:space-y-0 print:py-0": true,
          })}
          ref={ref}
        >
          <PrintButton />

          <PdfContainer index={0}>
            <PdfCover />
          </PdfContainer>

          <PdfContainer>
            <PfdGeographicContext />
          </PdfContainer>

          <PdfTopics />

          <PdfOutro />
        </div>
      </LoadProvider>
    </FormProvider>
  );
};

export default Pdf;
