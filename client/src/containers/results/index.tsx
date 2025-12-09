"use client";

import { useParams } from "next/navigation";

import { useHydrateAtoms } from "jotai/utils";

import { useReport } from "@/lib/report";

import { locationAtom, titleAtom, topicsViewAtom } from "@/app/(frontend)/store";

import ReportResultsContent from "@/containers/results/content";
import ReportResultsHeader from "@/containers/results/header";
import ReportResultsSidebar from "@/containers/results/sidebar";

export const ReportResults = () => {
  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });

  // Hydrate atoms on initial mount
  useHydrateAtoms(new Map([[titleAtom, reportData?.title]]));
  useHydrateAtoms(new Map([[locationAtom, reportData?.location]]));
  useHydrateAtoms(new Map([[topicsViewAtom, reportData?.topics]]));

  return (
    <main className="relative flex bg-blue-50 pb-5 print:w-full print:bg-white print:p-0">
      <div className="w-full flex-col print:w-full">
        <ReportResultsHeader />
        <ReportResultsContent />
      </div>
      <div className="relative print:hidden">
        <ReportResultsSidebar />
      </div>
    </main>
  );
};
