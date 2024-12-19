"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BetaDisclaimer({ onClose }: { onClose: (open: boolean) => void }) {
  return (
    <div className="p-6 text-sm">
      <div className="flex flex-col space-y-8">
        <h1 className="flex items-center space-x-4">
          <Image src="/IDB-logo.svg" alt="IDB" width={65} height={24} />
          <div className="space-x-2">
            <span className="text-sm font-medium text-blue-500">AmazoniaForever360+</span>

            <Badge variant="secondary">Beta</Badge>
          </div>
        </h1>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">What does Beta mean?</h3>
            <p className="font-medium">
              This website is a beta version of <strong>AmazoniaForever360+</strong>, designed to
              facilitate co-creation with select users. The contents and data are for demonstration
              purposes only and have not been fully validated yet.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">Why shouldn’t I share this link?</h3>
            <p className="font-medium">
              Please <strong>do not share this link</strong>, as the functionalities presented are
              intended for <strong>demonstration and testing purposes</strong> only.
            </p>
          </div>
        </div>
        <Button className="w-fit self-end" onClick={() => onClose(false)}>
          Got it
        </Button>
      </div>
    </div>
  );
}
