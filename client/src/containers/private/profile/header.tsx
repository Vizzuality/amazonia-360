"use client";

import { useTranslations } from "next-intl";

export const ProfileHeader = () => {
  const t = useTranslations();

  return (
    <header className="flex items-center justify-between pb-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold text-primary">{t("profile-title")}</h1>
        <p className="text-sm text-muted-foreground">{t("profile-description")}</p>
      </div>
    </header>
  );
};
