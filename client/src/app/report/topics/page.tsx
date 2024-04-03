import { Metadata } from "next";

import { redirect } from "next/navigation";

import { PageProps } from "@/app/types";

import Topics from "@/containers/report/topics";

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
    <main className="relative flex flex-col h-[calc(100svh_-_theme(space.20))] bg-blue-50 py-12">
      <div className="flex flex-col space-y-10">
        <header>
          <div className="container">
            <div className="max-w-2xl mx-auto space-y-4">
              <h1 className="text-3xl font-bold text-blue-500 text-center">
                What information would help you to better understand this
                location?
              </h1>
              <h2 className="text-sm text-gray-900 text-center font-medium">
                Choose your interests for a personalized report.
              </h2>
            </div>
          </div>
        </header>

        <Topics />
      </div>
    </main>
  );
}
