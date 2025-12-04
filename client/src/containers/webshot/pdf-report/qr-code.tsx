"use client";

import { useMemo } from "react";

import { useParams } from "next/navigation";

import { useLocale, useTranslations } from "next-intl";

import { QRCode, QRCodeCanvas } from "@/components/ui/qr-code";

export const QRCodeHelp = () => {
  const t = useTranslations();
  const { id } = useParams();
  const locale = useLocale();

  const URL = useMemo(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      return `${baseUrl}/${locale}/reports/${id}`;
    }
    return "";
  }, [id, locale]);

  return (
    <>
      <a href={URL} className="text-xs font-semibold text-primary underline">
        {URL}
      </a>
      <div className="flex flex-col items-center space-y-2">
        <QRCode value={URL} size={88}>
          <QRCodeCanvas />
        </QRCode>
        <p className="text-nowrap">{t("landing-help-scan")}</p>
      </div>
    </>
  );
};

export default QRCodeHelp;
