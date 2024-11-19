"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DownloadReport() {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Download className="h-5 w-5" />
    </Button>
  );
}
