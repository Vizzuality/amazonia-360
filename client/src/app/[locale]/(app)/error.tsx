"use client";

import { useTranslations } from "next-intl";

export default function Custom500() {
  const t = useTranslations();
  return (
    <div className="text-blue-ocean flex h-[calc(100svh_-_theme(space.40)_+_1px)] w-screen flex-col items-center justify-center bg-white">
      <div className="max-w-[601px] text-center">
        <h1 className="text-bold mb-[28px] text-xl">{t("error-page-title")}</h1>
        <p className="text-large">{t("error-page-message")}</p>
      </div>
    </div>
  );
}
