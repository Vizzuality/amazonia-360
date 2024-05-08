"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DownloadReport() {
  return (
    <Button className="space-x-2" onClick={() => window.print()}>
      <Download className="w-5 h-5" />
      <span>Download</span>
    </Button>
  );
}
