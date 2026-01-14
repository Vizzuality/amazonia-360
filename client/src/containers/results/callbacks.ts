"use client";

import { useCallback } from "react";

import { useFormContext } from "react-hook-form";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useDuplicateReport, useReport, useSaveReport } from "@/lib/report";

import { TopicView } from "@/app/(frontend)/parsers";
import { useFormLocation, useFormTitle, useFormTopics } from "@/app/(frontend)/store";

export const useSaveReportCallback = (callback?: () => void) => {
  const t = useTranslations();

  const { id } = useParams();

  const { data: reportData } = useReport({ id: `${id}` });
  const { data: session } = useSession();

  const form = useFormContext();
  const { title } = useFormTitle();
  const { topics } = useFormTopics();
  const { location } = useFormLocation();

  const saveMutation = useSaveReport();

  const callbackRef = useCallback(() => {
    toast.promise(
      saveMutation.mutateAsync(
        {
          id: `${id}`,
          title: title || reportData?.title || t("selected-area"),
          description: reportData?.description || null,
          topics: topics || (reportData?.topics as TopicView[]) || [],
          location: location || reportData?.location || null,
          status: session?.user.collection === "users" ? "published" : "draft",
        },
        {
          onSuccess: () => {
            form.reset(form.getValues()); // Reset form state to current values after saving
            if (callback) callback();
          },
        },
      ),
      {
        loading: t("report-save-loading"),
        success: t("report-save-success"),
        error: t("report-save-error"),
      },
    );
  }, [id, title, topics, location, session, saveMutation, t, reportData, form, callback]);

  return {
    mutation: saveMutation,
    handleSave: callbackRef,
  };
};

export const useDuplicateReportCallback = (callback?: (newReportId: string) => void) => {
  const t = useTranslations();

  const { id } = useParams();

  const { data: reportData } = useReport({ id: `${id}` });
  const { data: session } = useSession();

  const { title } = useFormTitle();
  const { topics } = useFormTopics();
  const { location } = useFormLocation();

  const duplicateMutation = useDuplicateReport();

  const callbackRef = useCallback(() => {
    toast.promise(
      duplicateMutation.mutateAsync(
        {
          title: title || reportData?.title || t("selected-area"),
          description: reportData?.description || null,
          topics: topics || (reportData?.topics as TopicView[]) || [],
          location: location || reportData?.location || null,
          status: session?.user.collection === "users" ? "published" : "draft",
        },
        {
          onSuccess: (data) => {
            // Redirect to the new duplicated report
            if (callback) callback(data.id);
          },
        },
      ),
      {
        loading: t("report-duplicate-loading"),
        success: t("report-duplicate-success"),
        error: t("report-duplicate-error"),
      },
    );
  }, [title, topics, location, session, duplicateMutation, t, reportData, callback]);

  return {
    mutation: duplicateMutation,
    handleDuplicate: callbackRef,
  };
};
