"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DownloadReport() {
  return (
    <Button variant="outline" className="hover:bg-primary/20" onClick={() => window.print()}>
      <Download className="h-5 w-5" />
    </Button>
  );
}
