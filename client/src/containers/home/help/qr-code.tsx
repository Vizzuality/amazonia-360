"use client";

import { useTranslations } from "next-intl";

import { QRCode, QRCodeCanvas } from "@/components/ui/qr-code";

export const QRCodeHelp = () => {
  const t = useTranslations();

  return (
    <div className="flex flex-col items-center space-y-2">
      <QRCode value={window.location.href} size={88}>
        <QRCodeCanvas />
      </QRCode>
      <p className="text-nowrap">{t("landing-help-scan")}</p>
    </div>
  );
};

export default QRCodeHelp;
