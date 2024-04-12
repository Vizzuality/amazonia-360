"use client";

import { useState } from "react";

import Link from "next/link";

import { LuDownload, LuLayoutGrid, LuPlus, LuShare2 } from "react-icons/lu";

import Topics from "@/containers/report/topics";

import { Button } from "@/components/ui/button";

export default function ReportResultsHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pb-6 space-y-4">
      <div className="container">
        <div className="flex justify-between">
          {/* Name */}
          <div className="flex items-center space-x-6">
            <h1 className="text-4xl font-bold text-primary">Testing</h1>

            <Link href="/report">
              <Button variant="outline" className="space-x-2">
                <LuPlus className="w-5 h-5" />
                <span>New report</span>
              </Button>
            </Link>
          </div>

          {/* Toolbar */}
          <div className="flex items-center space-x-4">
            <Button
              variant={open ? "default" : "outline"}
              className="space-x-2"
              onClick={() => setOpen(!open)}
            >
              <LuLayoutGrid className="w-5 h-5" />
              <span>Topics</span>
            </Button>
            <Button variant="outline" className="space-x-2">
              <LuShare2 className="w-5 h-5" />
            </Button>
            <Button variant="outline" className="space-x-2">
              <LuDownload className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {open && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <Topics size="sm" />
        </div>
      )}
    </header>
  );
}
