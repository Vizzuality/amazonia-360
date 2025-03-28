import { Metadata } from "next";

import PageProviders from "@/app/[locale]/report/page-providers";

import ReportLocation from "@/containers/report/location";

export const metadata: Metadata = {
  title: "Report | location",
  description: "Report description",
};

export default function ReportPage() {
  return (
    <PageProviders>
      <main className="relative flex min-h-[calc(100svh_-_theme(space.16))] flex-col">
        <ReportLocation />
      </main>
    </PageProviders>
  );
}
