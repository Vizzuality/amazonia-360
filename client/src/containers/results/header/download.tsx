"use client";

import { Download } from "lucide-react";

import { useGetOverviewTopics } from "@/lib/topics";

import { Button } from "@/components/ui/button";

export const GENERATE_PDF = async (url: string) => {
  const response = await fetch("/local-api/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate PDF");
  }

  return response.blob();
};

export default function DownloadReport() {
  const { data, isLoading } = useGetOverviewTopics();

  const handleClick = async () => {
    const data = await GENERATE_PDF(window.location.href);

    const blob = new Blob([data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `report.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isLoading || !data}>
      <Download className="h-5 w-5" />
    </Button>
  );
}
