"use client";

import { useEffect } from "react";

import { useParams } from "next/navigation";

import { useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

import { useReport } from "@/lib/report";

import { Location, TopicView } from "@/app/(frontend)/parsers";
import { locationAtom, titleAtom, topicsViewAtom } from "@/app/(frontend)/store";

import ReportResultsHeader from "@/containers/header/results";
import ReportResultsContent from "@/containers/results/content";
import ReportResultsSidebar from "@/containers/results/sidebar";

export const ReportResults = () => {
  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: Number(reportId) });

  // Hydrate atoms on initial mount
  useHydrateAtoms(new Map([[topicsViewAtom, reportData?.topics]]));
  useHydrateAtoms(new Map([[titleAtom, reportData?.title]]));
  useHydrateAtoms(new Map([[locationAtom, reportData?.location]]));

  // Update atoms when report data changes (for client-side navigation)
  const setTopicsView = useSetAtom(topicsViewAtom);
  const setTitle = useSetAtom(titleAtom);
  const setLocation = useSetAtom(locationAtom);

  useEffect(() => {
    if (reportData) {
      setTopicsView(reportData.topics as TopicView[] | null | undefined);
      setTitle(reportData.title);
      setLocation(reportData.location as Location | null);
    }
  }, [reportData, setTopicsView, setTitle, setLocation]);

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
