"use client";

import { useCallback } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LuFileText } from "react-icons/lu";
import { toast } from "sonner";

import { useCanEditReport, useDuplicateReport, useReport, useSaveReport } from "@/lib/report";

import { TopicView } from "@/app/(frontend)/parsers";
import { useSyncLocation, useFormTitle, useFormTopics } from "@/app/(frontend)/store";

import { AuthWrapper } from "@/containers/auth/wrapper";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useRouter } from "@/i18n/navigation";

export default function SaveReport() {
  const t = useTranslations();
  const { id } = useParams();
  const router = useRouter();

  const { data: reportData } = useReport({ id: `${id}` });
  const { data: session } = useSession();

  const [title] = useFormTitle();
  const { topics } = useFormTopics();
  const [location] = useSyncLocation();

  const saveMutation = useSaveReport();
  const duplicateMutation = useDuplicateReport();

  const CAN_EDIT = useCanEditReport(`${id}`);

  const handleSave = useCallback(() => {
    toast.promise(
      saveMutation.mutateAsync({
        id: `${id}`,
        title: title || reportData?.title || t("selected-area"),
        description: reportData?.description || null,
        topics: topics || (reportData?.topics as TopicView[]) || [],
        location: location || reportData?.location || null,
        status: session?.user.collection === "users" ? "published" : "draft",
      }),
      {
        loading: "Saving report...",
        success: "Report saved successfully!",
        error: "Failed to save the report.",
      },
    );
  }, [id, title, topics, location, session, saveMutation, t, reportData]);

  const handleDuplicate = useCallback(() => {
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
            router.push(`/reports/${data.id}`);
          },
        },
      ),
      {
        loading: "Duplicating report...",
        success: "Report duplicated successfully!",
        error: "Failed to duplicate the report.",
      },
    );
  }, [title, topics, location, session, duplicateMutation, t, reportData, router]);

  if (CAN_EDIT) {
    return (
      <AuthWrapper>
        <Button onClick={handleSave} className="space-x-2" disabled={saveMutation.isPending}>
          {!saveMutation.isPending && <LuFileText className="h-5 w-5" />}
          {saveMutation.isPending && <Spinner className="h-5 w-5" />}
          <span>{t("save")}</span>
        </Button>
      </AuthWrapper>
    );
  }

  return (
    <AuthWrapper>
      <Button
        onClick={handleDuplicate}
        className="space-x-2"
        disabled={duplicateMutation.isPending}
      >
        {!duplicateMutation.isPending && <LuFileText className="h-5 w-5" />}
        {duplicateMutation.isPending && <Spinner className="h-5 w-5" />}
        <span>Make a copy</span>
      </Button>
    </AuthWrapper>
  );
}
