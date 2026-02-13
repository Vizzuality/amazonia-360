"use client";

import { useTranslations } from "next-intl";

export default function Custom500() {
  const t = useTranslations();
  return (
    <div className="text-blue-ocean flex h-[calc(100svh-calc(var(--spacing)*40)+1px)] w-screen flex-col items-center justify-center bg-white">
      <div className="max-w-150.25 text-center">
        <h1 className="text-bold mb-7 text-xl">{t("error-page-title")}</h1>
        <p className="text-large">{t("error-page-message")}</p>
      </div>
    </div>
  );
}
