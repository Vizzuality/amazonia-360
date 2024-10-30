"use client";

import { useState } from "react";

import Link from "next/link";

import { LuLayoutGrid, LuPlus } from "react-icons/lu";

import { useLocationTitle } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

import DownloadReport from "@/containers/report/results/header/download";
import Topics from "@/containers/report/topics";

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

import ShareReport from "./share";

export default function ReportResultsHeader() {
  const [location] = useSyncLocation();

  const title = useLocationTitle(location);

  const [open] = useState(false);
  const { toggleSidebar } = useSidebar();

  return (
    <header className="space-y-4 pb-6">
      <div className="container">
        <div className="flex justify-between">
          {/* Name */}
          <div className="mr-4 flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-primary lg:text-3xl tall:xl:text-4xl">
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

          <div className="flex items-center space-x-4 print:hidden">
            <Button
              variant={open ? "default" : "outline"}
              className="space-x-2"
              onClick={() => {
                // onClick?.(event);
                toggleSidebar();
              }}
            >
              <LuLayoutGrid className="h-5 w-5" />
              <span>Indicators</span>
            </Button>

            <ShareReport />

            <DownloadReport />
          </div>
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
