"use client";

import ReactMarkdown from "react-markdown";

import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";

import { sketchActionAtom } from "@/app/store";

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
    <div className="pointer-events-none absolute left-0 top-4 z-10 w-full duration-300 animate-in fade-in-0 lg:top-10">
      <div className="container">
        <div className="grid grid-cols-12">
          <div className="col-span-10 lg:col-span-5 lg:col-start-8">
            <div className="-mx-1 flex lg:mx-0 lg:justify-center">
              <div className="rounded bg-white p-2 shadow-md">
                <div className="prose prose-sm text-2xs font-light text-foreground lg:text-center lg:text-sm">
                  {sketchAction.type === "create" &&
                    CREATE_MESSAGES[`${sketchAction.geometryType}`][sketchAction?.state ?? "start"]}

                  {sketchAction.type === "update" &&
                    UPDATE_MESSAGES[`${sketchAction.geometryType}`][sketchAction?.state ?? "start"]}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
};
