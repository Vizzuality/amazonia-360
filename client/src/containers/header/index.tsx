"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { DialogTitle } from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import BetaDisclaimer from "../disclaimers/demo";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-20 flex-col justify-center bg-white backdrop-blur">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <h1 className="flex items-center space-x-4">
              <Image src="/IDB-logo.svg" alt="IDB" width={65} height={24} />
              <div className="space-x-2">
                <span className="text-sm font-medium">AmazoniaForever360+</span>
              </div>
            </h1>
          </Link>
          <Dialog open={open}>
            <DialogTrigger onClick={() => setOpen(!open)}>
              <Badge variant="secondary">Beta</Badge>
            </DialogTrigger>

            <DialogContent className="p-0">
              <DialogTitle className="sr-only">AmazoniaForever360+ beta version</DialogTitle>
              <BetaDisclaimer onClose={setOpen} />
            </DialogContent>
          </Dialog>
        </div>

        <nav className="flex space-x-8 print:hidden">
          <Link
            className={cn({
              "text-sm hover:text-cyan-500": true,
              "text-cyan-500": pathname === "/",
            })}
            href="/"
          >
            Home
          </Link>

          <Link
            className={cn({
              "text-sm hover:text-cyan-500": true,
              "text-cyan-500": pathname.includes("/report"),
            })}
            href="/report"
          >
            Report Tool
          </Link>
          <Link
            className={cn({
              "text-sm hover:text-cyan-500": true,
              "text-cyan-500": pathname.includes("/hub"),
            })}
            href="/hub"
          >
            Hub
          </Link>

          {/* <Link className="text-blue-600 hover:text-blue-700" href="#">
            Amazonia Forever
          </Link> */}
        </nav>
      </div>
    </header>
  );
}
