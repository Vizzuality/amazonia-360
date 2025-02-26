"use client";

import { useState } from "react";

import Link from "next/link";

import { LuPlus } from "react-icons/lu";

import { useLocationTitle } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import Topics from "@/containers/report/topics";
import DownloadReport from "@/containers/results/header/download";
import IndicatorsReport from "@/containers/results/header/indicators";
import ShareReport from "@/containers/results/header/share";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export default function ReportResultsHeader() {
  const [location] = useSyncLocation();

  const title = useLocationTitle(location);

  const [open] = useState(false);

  const { open: isSidebarOpen } = useSidebar();

  return (
    <header className="sticky right-0 top-0 z-10 space-y-4 bg-blue-50 py-6">
      <div className="container">
        <div className="relative flex h-full justify-between">
          {/* Name */}
          <div className="mr-4 flex items-center space-x-6">
            <h1 className="tall:xl:text-4xl text-2xl font-bold text-primary lg:text-3xl">
              {title}
            </h1>

            <AlertDialog>
              <AlertDialogTrigger asChild className="print:hidden">
                <Button variant="outline" className="space-x-2">
                  <LuPlus className="h-5 w-5" />
                  <span>New report</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>New report</AlertDialogTitle>
                  <AlertDialogDescription>
                    Proceed if you wish to generate a new report by selecting a new area. Note that
                    switching areas will refresh your current session, and the existing report will
                    be lost.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <Link href="/report">
                    <AlertDialogAction>Continue</AlertDialogAction>
                  </Link>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {!isSidebarOpen && (
            <div className="flex items-center space-x-2 print:hidden">
              <DownloadReport />
              <ShareReport />
              <IndicatorsReport />
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="duration-300 animate-in fade-in zoom-in-95">
          <Topics size="sm" interactive />
        </div>
      )}
    </header>
  );
}
