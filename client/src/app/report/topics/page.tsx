import { Metadata } from "next";

import Topics from "@/containers/report/topics";

export const metadata: Metadata = {
  title: "Report | topics",
  description: "Report topics description",
};

export default function ReportTopicsPage() {
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
                Select your topics of interest to get a more tailormaid report.
              </h2>
            </div>
          </div>
        </header>

        <Topics />
      </div>
    </main>
  );
}
