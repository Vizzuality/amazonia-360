"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DialogTitle } from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogTrigger, DialogHeader } from "@/components/ui/dialog";

import LogoBetaInfo from "./logo-beta-info";

export default function MobileNavigation() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [, setMenuVisibility] = useState<boolean>(false);

  const handleClick = () => {
    setIsOpen((prev) => !prev);
    setMenuVisibility(false);
    if (isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    //eslint-disable-next-line
  }, [pathname]);

  return (
    <Dialog open={isOpen}>
      <DialogTrigger asChild>
        <button
          onClick={handleClick}
          type="button"
          className={`z-[1000] flex h-8 w-8 cursor-pointer flex-col flex-wrap justify-around`}
        >
          <div
            className={`block h-0.5 w-8 origin-[1px] rounded bg-blue-600 transition-all ${
              isOpen ? "rotate-45" : "rotate-0"
            }`}
          />
          <div
            className={`block h-0.5 w-8 origin-[1px] rounded bg-blue-600 transition-all ${
              isOpen ? "translate-x-full bg-transparent" : "translate-x-0"
            }`}
          />
          <div
            className={`block h-0.5 w-8 origin-[1px] rounded bg-blue-600 transition-all ${
              isOpen ? "rotate-[-45deg]" : "rotate-0"
            }`}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="absolute left-0 top-20 w-screen max-w-none !translate-x-0 !translate-y-0 px-0 py-0 text-blue-600">
        <DialogHeader>
          <LogoBetaInfo />
          <DialogTitle className="sr-only">AmazoniaForever360+ beta version</DialogTitle>
          <nav className="flex flex-col space-y-8 bg-white print:hidden">
            <Link
              className={cn({
                "text-lg hover:text-cyan-500": true,
                "text-cyan-500": pathname === "/",
              })}
              href="/"
            >
              Home
            </Link>

            <Link
              className={cn({
                "text-lg hover:text-cyan-500": true,
                "text-cyan-500": pathname.includes("/report"),
              })}
              href="/report"
            >
              Report Tool
            </Link>
            <Link
              className={cn({
                "text-lg hover:text-cyan-500": true,
                "text-cyan-500": pathname.includes("/hub"),
              })}
              href="/hub"
            >
              Hub
            </Link>
          </nav>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
