"use client";

import { Download } from "lucide-react";

import { useGetOverviewTopics } from "@/lib/topics";

import { Button } from "@/components/ui/button";

export default function DownloadReport() {
  const { data, isLoading } = useGetOverviewTopics();

  return (
    <Button variant="outline" onClick={() => window.print()} disabled={isLoading || !data}>
      <Download className="h-5 w-5" />
    </Button>
  );
}
