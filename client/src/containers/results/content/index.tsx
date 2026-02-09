"use client";

import Markdown from "react-markdown";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import ReportResultsContentList from "@/containers/results/content/list";
import ReportResultsContentOtherResources from "@/containers/results/content/other-resources";
import ReportResultsContentOverview from "@/containers/results/content/overview";
import ReportResultsContentSidebarButton from "@/containers/results/content/sidebar-button";

export default function ReportResultsContent() {
  const t = useTranslations();
  const { data: session } = useSession();
  const isAnonymous = !session?.user || session.user.collection === "anonymous-users";

  return (
    <div className="-mt-4 flex flex-col space-y-8">
      {isAnonymous && (
        <div className="container">
          <Markdown className="text-normal mt-2 rounded-md border border-border bg-orange-50 px-4 py-3 text-foreground 2xl:text-lg">
            {t("report-results-anonymous-disclaimer")}
          </Markdown>
        </div>
      )}

      <div className="flex flex-col space-y-20 print:space-y-6">
        {/* OVERVIEW */}
        <ReportResultsContentOverview />

        {/* LIST */}
        <ReportResultsContentList />

        {/* BUTTOIN */}
        <ReportResultsContentSidebarButton />

        {/* OTHER RESOURCES */}
        <ReportResultsContentOtherResources />
      </div>
    </div>
  );
}
