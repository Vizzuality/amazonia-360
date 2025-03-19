"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePrevious } from "@dnd-kit/utilities";
import { DialogTitle } from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogTrigger, DialogHeader } from "@/components/ui/dialog";

import LogoBetaInfo from "./logo-beta-info";

export default function MobileNavigation() {
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    if (previousPathname !== pathname) {
      setIsOpen(false);
    }
  }, [pathname, previousPathname]);

  return (
    <Dialog open={isOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="fixed right-5 top-1/2 z-[110] flex h-6 w-6 -translate-y-1/2 transform cursor-pointer flex-col flex-wrap justify-around"
        >
          <div
            className={`block h-0.5 w-6 origin-[1px] rounded-full bg-blue-600 transition-all ${
              isOpen ? "rotate-45" : "rotate-0"
            }`}
          />
          <div
            className={`block h-0.5 w-6 origin-[1px] rounded bg-blue-600 transition-all ${
              isOpen ? "translate-x-full bg-transparent" : "translate-x-0"
            }`}
          />
          <div
            className={`block h-0.5 w-6 origin-[1px] rounded bg-blue-600 transition-all ${
              isOpen ? "rotate-[-45deg]" : "rotate-0"
            }`}
          />
        </button>
      </DialogTrigger>

      <DialogContent
        className="absolute left-0 top-0 z-[100] h-full w-screen max-w-none !translate-x-0 !translate-y-0 border-none px-0 py-0 text-blue-600"
        overlay={false}
      >
        <div>
          <DialogHeader className="flex h-16 w-full flex-col items-center bg-white text-center backdrop-blur sm:text-left">
            <div className="flex h-full w-full flex-col justify-center bg-white backdrop-blur">
              <div className="mx-4 flex items-center justify-between md:container md:mx-auto">
                <DialogTitle className="sr-only">AmazoniaForever360+ beta version</DialogTitle>
                <LogoBetaInfo />

                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="z-[110] flex h-6 w-6 transform cursor-pointer flex-col flex-wrap justify-around"
                >
                  <div
                    className={`block h-0.5 w-6 origin-[1px] rounded-full bg-blue-600 transition-all ${
                      isOpen ? "rotate-45" : "rotate-0"
                    }`}
                  />
                  <div
                    className={`block h-0.5 w-6 origin-[1px] rounded bg-blue-600 transition-all ${
                      isOpen ? "translate-x-full bg-transparent" : "translate-x-0"
                    }`}
                  />
                  <div
                    className={`block h-0.5 w-6 origin-[1px] rounded bg-blue-600 transition-all ${
                      isOpen ? "rotate-[-45deg]" : "rotate-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </DialogHeader>
          <nav className="flex flex-col justify-start bg-white text-left print:hidden">
            <Link
              className={cn({
                "px-6 py-4 text-lg text-blue-900 hover:bg-blue-200 hover:text-blue-500": true,
                "text-blue-500": pathname === "/",
              })}
              href="/"
            >
              Home
            </Link>
            <Link
              className={cn({
                "px-6 py-4 text-lg text-blue-900 hover:bg-blue-200 hover:text-blue-500": true,
                "text-blue-500": pathname.includes("/report"),
              })}
              href="/report"
            >
              Report Tool
            </Link>
            <Link
              className={cn({
                "px-6 py-4 text-lg text-blue-900 hover:bg-blue-200 hover:text-blue-500": true,
                "text-blue-500": pathname.includes("/hub"),
              })}
              href="/hub"
            >
              Hub
            </Link>
          </nav>
        </div>
      </DialogContent>
    </Dialog>
  );
}
