"use client";

import { useSearchParams } from "next/navigation";

import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function ReportButton() {
  const searchParams = useSearchParams();

  return (
    <Link href={`/webshot/report/?${searchParams.toString()}`} target="_blank">
      <Button variant="outline" className="space-x-2 border-none px-2.5 py-2 shadow-none">
        <FileDown className="h-5 w-5" />
      </Button>
    </Link>
  );
}
