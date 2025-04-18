"use client";

import { useState } from "react";

import Image from "next/image";

import { DialogTitle } from "@radix-ui/react-dialog";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

import { Link } from "@/i18n/navigation";

import BetaDisclaimer from "../disclaimers/demo";

export default function LogoBetaInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="z-[120] flex items-center space-x-2">
      <Link href="/">
        <h1 className="flex items-center space-x-2 lg:space-x-4">
          <Image src="/IDB-logo.svg" alt="IDB" width={65} height={24} />
          <div className="space-x-2">
            <span className="text-xs font-medium text-blue-500 lg:text-sm">
              AmazoniaForever360+
            </span>
          </div>
        </h1>
      </Link>
      <Dialog open={open}>
        <DialogTrigger onClick={() => setOpen(!open)}>
          <Badge className="text-xs lg:text-sm" variant="secondary">
            Beta
          </Badge>
        </DialogTrigger>

        <DialogDescription className="sr-only">AmazoniaForever360+ beta version</DialogDescription>

        <DialogContent className="p-0">
          <DialogTitle className="sr-only">AmazoniaForever360+ beta version</DialogTitle>
          <BetaDisclaimer onClose={setOpen} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
