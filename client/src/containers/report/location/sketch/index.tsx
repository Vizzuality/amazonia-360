"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import SketchButtons from "@/components/map/sketch/sketch-buttons";

export default function Sketch() {
  const t = useTranslations();

  return (
    <div className={cn("flex w-full flex-col justify-between gap-2 text-sm")}>
      <span className="text-muted-foreground leading-none font-semibold">
        {t("draw-on-the-map")}
      </span>
      <div className="flex gap-1">
        <SketchButtons iconOnly={false} />
      </div>
    </div>
  );
}
