"use client";

import { useTranslations } from "next-intl";

import SketchButtons from "@/components/map/sketch/sketch-buttons";

export default function DesktopDrawingTools() {
  const t = useTranslations();

  return (
    <div className="flex items-center space-x-4 print:hidden">
      <span className="text-sm font-semibold text-muted-foreground">{t("draw")}</span>
      <div className="flex items-center space-x-1">
        <SketchButtons iconOnly={true} />
      </div>
    </div>
  );
}
