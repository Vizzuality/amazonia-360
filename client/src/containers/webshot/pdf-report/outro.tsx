"use client";

import dynamic from "next/dynamic";

import { useTranslations } from "next-intl";

const QRCode = dynamic(() => import("./qr-code"), { ssr: false });

export const PdfOutro = () => {
  const t = useTranslations();

  return (
    <div className="flex grow flex-col items-center justify-between px-16 py-12">
      <div className="flex grow flex-col items-center justify-center space-y-6 text-center">
        <header className="max-w-2xl space-y-4 font-normal">
          <h1 className="text-2xl font-semibold text-primary">{t("pdf-outro-title")}</h1>

          <div className="space-y-6">
            <p className="text-xs text-foreground">{t("pdf-outro-description-1")}</p>

            <p className="text-xs text-foreground">{t("pdf-outro-description-2")}</p>
          </div>
        </header>

        <div className="flex flex-col items-center space-y-6">
          <QRCode />
        </div>

        <p className="max-w-3xl text-xs font-semibold text-foreground">{t("pdf-outro-tagline")}</p>
      </div>

      <div className="text space-y-2">
        <p className="text-2xs font-medium">{t("report-results-disclaimer-part-1")}</p>

        <p className="text-2xs font-medium">{t("report-results-disclaimer-part-2")}</p>

        <p className="text-2xs font-medium">{t("report-results-disclaimer-part-3")}</p>
      </div>
    </div>
  );
};
