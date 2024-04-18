import { Metadata } from "next";

import { redirect } from "next/navigation";

import { PageProps } from "@/app/types";

import Topics from "@/containers/report/topics";
import TopicsFooter from "@/containers/report/topics/footer";
import TopicsHeader from "@/containers/report/topics/header";

export const metadata: Metadata = {
  title: "Report | topics",
  description: "Report topics description",
};

// Define the types for the page parameters
export interface Params {}

export interface SearchParams {
  location: string;
}

export default async function ReportTopicsPage({
  searchParams,
}: PageProps<Params, SearchParams>) {
  if (!searchParams.location) {
    redirect("/report");
  }

  return (
    <main className="relative flex flex-col bg-blue-50 py-12 min-h-[calc(100svh_-_theme(space.40)_+_1px)]">
      <div className="flex flex-col space-y-10">
        <TopicsHeader />

        <div className="space-y-6">
          <Topics size="lg" interactive />

          <TopicsFooter />
        </div>
      </div>
    </main>
  );
}
