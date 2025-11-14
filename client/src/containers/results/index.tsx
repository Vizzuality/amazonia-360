"use client";

import { useParams } from "next/navigation";

import { useHydrateAtoms } from "jotai/utils";

import { useReport } from "@/lib/report";

import { titleAtom, topicsViewAtom } from "@/app/(frontend)/store";

import ReportResultsHeader from "@/containers/header/results";
import ReportResultsContent from "@/containers/results/content";
import ReportResultsSidebar from "@/containers/results/sidebar";

export const ReportResults = () => {
  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: Number(reportId) });

  // Use separate calls to avoid type conflicts between different atom types
  useHydrateAtoms(new Map([[topicsViewAtom, reportData?.topics]]));
  useHydrateAtoms(new Map([[titleAtom, reportData?.title]]));

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
