"use client";

import { useState } from "react";

import Link from "next/link";

import { Download } from "lucide-react";
import { LuLayoutGrid, LuPlus } from "react-icons/lu";

import { useLocationTitle } from "@/lib/location";

import { useSyncLocation } from "@/app/store";

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

import ShareReport from "./share";

export default function ReportResultsHeader() {
  const [location] = useSyncLocation();

  const title = useLocationTitle(location);

  const [open, setOpen] = useState(false);

  return (
    <header className="pb-6 space-y-4">
      <div className="container">
        <div className="flex justify-between">
          {/* Name */}
          <div className="flex items-center space-x-6 mr-4">
            <h1 className="text-4xl font-bold text-primary">{title}</h1>

            <AlertDialog>
              <AlertDialogTrigger asChild className="print:hidden">
                <Button variant="outline" className="space-x-2">
                  <LuPlus className="w-5 h-5" />
                  <span>New report</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>New report</AlertDialogTitle>
                  <AlertDialogDescription>
                    Proceed if you wish to generate a new report by selecting a
                    new area. Note that switching areas will refresh your
                    current session, and the existing report will be lost.
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

          {/* Toolbar */}
          <div className="flex items-center space-x-4 print:hidden">
            <Button
              variant={open ? "default" : "outline"}
              className="space-x-2"
              onClick={() => setOpen(!open)}
            >
              <LuLayoutGrid className="w-5 h-5" />
              <span>Topics</span>
            </Button>

            <ShareReport />

            <Button
              variant="outline"
              className="space-x-2"
              onClick={() => window.print()}
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {open && (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <Topics size="sm" clickable />
        </div>
      )}
    </header>
  );
}
