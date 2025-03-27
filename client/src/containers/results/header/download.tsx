"use client";

import { Download } from "lucide-react";

import { useGetMutationPDF } from "@/lib/pdf";
import { useGetOverviewTopics } from "@/lib/topics";

import { Button } from "@/components/ui/button";

export default function DownloadReport() {
  const { data, isLoading } = useGetOverviewTopics();
  const mutation = useGetMutationPDF();

  const handleClick = async () => {
    window.print();

    // mutation.mutate(
    //   { url: window.location.href },
    //   {
    //     onSuccess: (response) => {
    //       if (!response?.data) return;
    //       const url = window.URL.createObjectURL(response.data);
    //       const link = document.createElement("a");
    //       link.href = url;
    //       link.download = `report.pdf`;
    //       document.body.appendChild(link);
    //       link.click();
    //       link.remove();
    //     },
    //   },
    // );
  };

  return (
    <Button
      variant="outline"
      className="space-x-2"
      onClick={handleClick}
      disabled={isLoading || !data || mutation.status === "pending"}
    >
      <Download className="h-5 w-5" />
      {mutation.status === "pending" && <span>Generating PDF...</span>}
    </Button>
  );
}
