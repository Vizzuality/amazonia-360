"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DownloadReport() {
  return (
    <Button className="space-x-2" onClick={() => window.print()}>
      <Download className="h-5 w-5" />
      <span>Download</span>
    </Button>
  );
}
