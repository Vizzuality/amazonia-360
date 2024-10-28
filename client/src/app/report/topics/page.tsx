import { Metadata } from "next";

import { redirect } from "next/navigation";

import { locationParser } from "@/app/parsers";
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

export default async function ReportTopicsPage({ searchParams }: PageProps<Params, SearchParams>) {
  const l = locationParser.parseServerSide((await searchParams).location);

  if (!l) {
    redirect("/report");
  }

  return (
    <main className="relative flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col bg-blue-50 py-12">
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
