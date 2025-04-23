"use client";

import ReactMarkdown from "react-markdown";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BetaDisclaimer({ onClose }: { onClose: (open: boolean) => void }) {
  const t = useTranslations();
  return (
    <div className="p-6 text-sm">
      <div className="flex flex-col space-y-8">
        <h1 className="flex items-center space-x-4">
          <Image src="/IDB-logo.svg" alt="IDB" width={65} height={24} />
          <div className="space-x-2">
            <span className="text-sm font-medium text-blue-500">
              {t("metadata-home-page-title")}
            </span>

            <Badge variant="secondary">{t("beta")}</Badge>
          </div>
        </h1>
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">{t("beta-disclaimer-title-1")}</h3>
            <div className="font-medium">
              <ReactMarkdown>{t("beta-disclaimer-description-1")}</ReactMarkdown>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-primary">{t("beta-disclaimer-title-2")}</h3>
            <div className="font-medium">
              <ReactMarkdown>{t("beta-disclaimer-description-2")}</ReactMarkdown>
            </div>
          </div>
        </div>
        <Button className="w-fit self-end" onClick={() => onClose(false)}>
          {t("got-it-alert-button")}
        </Button>
      </div>
    </div>
  );
}
