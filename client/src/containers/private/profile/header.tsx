"use client";

import { useTranslations } from "next-intl";

export const ProfileHeader = () => {
  const t = useTranslations();

  return (
    <header className="flex items-center justify-between pb-10">
      <div className="space-y-2">
        <h1 className="text-primary text-4xl font-semibold">{t("profile-title")}</h1>
        <p className="text-muted-foreground text-sm">{t("profile-description")}</p>
      </div>
    </header>
  );
};
