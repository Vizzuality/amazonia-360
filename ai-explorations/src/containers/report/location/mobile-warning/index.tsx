"use client";

import { useMemo, useState } from "react";

import { useTranslations } from "use-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function ReportMobileWarning() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  useMemo(() => {
    // eslint-disable-next-line react-hooks/set-state-in-render -- flagged by eslint-plugin-react-hooks 7.1; the fix changes behaviour, kept as in client
    setOpen(true);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">{t("mobile-alert-title")}</DialogTitle>
      <DialogDescription className="sr-only">{t("mobile-alert-description")}.</DialogDescription>
      <DialogContent aria-describedby={t("mobile-alert-title")}>
        <div>
          <h2 className="text-lg">{t("mobile-alert-title")}</h2>

          <p className="mt-2 text-sm text-muted-foreground">{t("mobile-alert-description")}.</p>

          <div className="mt-4 flex justify-end">
            <Button onClick={() => setOpen(false)} variant="default">
              {t("got-it-alert-button")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
