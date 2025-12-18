"use client";

import { useCallback } from "react";

import { FormProvider, useForm } from "react-hook-form";

import { useParams } from "next/navigation";

import { useHydrateAtoms } from "jotai/utils";

import { useReport } from "@/lib/report";

import { locationAtom } from "@/app/(frontend)/store";

import { LoadProvider } from "@/containers/indicators/load-provider";
import ReportResultsContent from "@/containers/results/content";
import ReportResultsHeader from "@/containers/results/header";
import ReportResultsSidebar from "@/containers/results/sidebar";

import { Report } from "@/payload-types";

export type ReportFormData = Pick<Report, "title" | "description" | "topics" | "location">;

export const ReportResults = () => {
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

  const onSubmit = useCallback((data: ReportFormData) => {
    console.log("Form submitted:", data);
  }, []);
  // Hydrate atoms on initial mount
  useHydrateAtoms(new Map([[locationAtom, reportData?.location]]));

  return (
    <FormProvider {...methods}>
      <LoadProvider>
        <main className="relative flex bg-blue-50 pb-5 print:w-full print:bg-white print:p-0">
          <form onSubmit={methods.handleSubmit(onSubmit)} className="flex w-full">
            <div className="w-full flex-col print:w-full">
              <ReportResultsHeader />
              <ReportResultsContent />
            </div>
            <div className="relative print:hidden">
              <ReportResultsSidebar />
            </div>
          </form>
        </main>
      </LoadProvider>
    </FormProvider>
  );
};
