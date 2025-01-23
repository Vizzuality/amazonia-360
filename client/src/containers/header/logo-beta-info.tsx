"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { DialogTitle } from "@radix-ui/react-dialog";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import BetaDisclaimer from "../disclaimers/demo";

export default function LogoBetaInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="z-[120] flex items-center space-x-2">
      <Link href="/">
        <h1 className="flex items-center space-x-4">
          <Image src="/IDB-logo.svg" alt="IDB" width={65} height={24} />
          <div className="space-x-2">
            <span className="text-sm font-medium text-blue-500">AmazoniaForever360+</span>
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
  );
}
