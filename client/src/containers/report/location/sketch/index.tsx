"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import SketchButtons from "@/components/map/sketch/sketch-buttons";

export default function Sketch() {
  const t = useTranslations();

  return (
    <div className={cn("flex w-full items-center justify-between gap-2 text-sm")}>
      <span className="font-semibold leading-none">{t("draw-on-the-map")}</span>
      <SketchButtons iconOnly={false} />
    </div>
  );
}
