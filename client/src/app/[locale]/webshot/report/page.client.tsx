"use client";

import dynamic from "next/dynamic";

const Pdf = dynamic(() => import("@/containers/webshot/pdf-report"), {
  ssr: false,
});

export default function WebshotReportClient() {
  return (
    <main className="relative">
      <Pdf />
    </main>
  );
}
