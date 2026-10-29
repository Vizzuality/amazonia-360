"use client";

import { useTranslations } from "use-intl";

import { cn } from "@/lib/utils";

import SketchButtons from "@/components/map/sketch/sketch-buttons";

export default function Sketch() {
  const t = useTranslations();

  return (
    <div className={cn("flex w-full flex-col justify-between gap-2 text-sm")}>
      <span className="leading-none font-semibold text-muted-foreground">
        {t("draw-on-the-map")}
      </span>
      <div className="flex gap-1">
        <SketchButtons iconOnly={false} />
      </div>
    </div>
  );
}
