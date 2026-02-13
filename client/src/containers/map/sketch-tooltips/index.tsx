"use client";

import ReactMarkdown from "react-markdown";

import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";

import { sketchActionAtom } from "@/app/(frontend)/store";

export const SketchTooltips = () => {
  const t = useTranslations();

  const CREATE_MESSAGES = {
    polygon: {
      start: <ReactMarkdown>{t("grid-sketch-tooltip-create-start-polygon")}</ReactMarkdown>,
      active: <ReactMarkdown>{t("grid-sketch-tooltip-create-active-polygon")}</ReactMarkdown>,
      complete: <ReactMarkdown>{t("grid-sketch-tooltip-create-complete-polygon")}</ReactMarkdown>,
      cancel: null,
    },
    polyline: {
      start: <ReactMarkdown>{t("grid-sketch-tooltip-create-start-polyline")}</ReactMarkdown>,
      active: <ReactMarkdown>{t("grid-sketch-tooltip-create-active-polyline")}</ReactMarkdown>,
      complete: <ReactMarkdown>{t("grid-sketch-tooltip-create-complete-polyline")}</ReactMarkdown>,
      cancel: null,
    },
    point: {
      start: <ReactMarkdown>{t("grid-sketch-tooltip-create-start-point")}</ReactMarkdown>,
      active: <ReactMarkdown>{t("grid-sketch-tooltip-create-active-point")}</ReactMarkdown>,
      complete: <ReactMarkdown>{t("grid-sketch-tooltip-create-complete-point")}</ReactMarkdown>,
      cancel: null,
    },
  } as const;

  const UPDATE_MESSAGES = {
    polygon: {
      start: <ReactMarkdown>{t("grid-sketch-tooltip-update-start-polygon")}</ReactMarkdown>,
      active: <ReactMarkdown>{t("grid-sketch-tooltip-update-active-polygon")}</ReactMarkdown>,
      complete: null,
      cancel: null,
    },
    polyline: {
      start: <ReactMarkdown>{t("grid-sketch-tooltip-update-start-polyline")}</ReactMarkdown>,
      active: <ReactMarkdown>{t("grid-sketch-tooltip-update-active-polyline")}</ReactMarkdown>,
      complete: null,
      cancel: null,
    },
    point: {
      start: <ReactMarkdown>{t("grid-sketch-tooltip-update-start-point")}</ReactMarkdown>,
      active: <ReactMarkdown>{t("grid-sketch-tooltip-update-active-point")}</ReactMarkdown>,
      complete: null,
      cancel: null,
    },
  } as const;
  const sketchAction = useAtomValue(sketchActionAtom);

  if (
    !sketchAction.type ||
    !sketchAction.geometryType ||
    (sketchAction.geometryType !== "polygon" &&
      sketchAction.geometryType !== "polyline" &&
      sketchAction.geometryType !== "point")
  )
    return null;
  return (
    <div className="rounded bg-white p-2 shadow-md">
      <div className="prose prose-sm text-2xs text-foreground font-light lg:text-sm">
        {sketchAction.type === "create" &&
          CREATE_MESSAGES[`${sketchAction.geometryType}`][sketchAction?.state ?? "start"]}

        {sketchAction.type === "update" &&
          UPDATE_MESSAGES[`${sketchAction.geometryType}`][sketchAction?.state ?? "start"]}
      </div>
    </div>
  );
};
