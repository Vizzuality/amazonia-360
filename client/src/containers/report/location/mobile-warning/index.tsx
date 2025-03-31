"use client";

import { useMemo, useState } from "react";

import { DialogDescription } from "@radix-ui/react-dialog";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export default function ReportMobileWarning() {
  const [open, setOpen] = useState(false);

  useMemo(() => {
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Limited mobile experience</DialogTitle>
      <DialogDescription className="sr-only">
        Some features may be restricted on mobile for better usability. For full functionality,
        please consider using a larger screen.
      </DialogDescription>
      <DialogContent aria-describedby="Limited mobile experience">
        <div>
          <h2 className="text-lg">Limited mobile experience</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Some features may be restricted on mobile for better usability. For full functionality,
            please consider using a larger screen.
          </p>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setOpen(false)} variant="default">
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
