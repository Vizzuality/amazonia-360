import { useCallback } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LuFileText } from "react-icons/lu";
import { toast } from "sonner";

import { useCanEditReport, useDuplicateReport, useReport, useSaveReport } from "@/lib/report";

import { TopicView } from "@/app/(frontend)/parsers";
import { useSyncLocation, useSyncTitle, useSyncTopics } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";

import { useRouter } from "@/i18n/navigation";

export default function SaveReport() {
  const locale = useLocale();
  const t = useTranslations();
  const { id } = useParams();
  const router = useRouter();

  const { data: reportData } = useReport({ id: Number(id) });
  const { data: session } = useSession();

  const [title] = useSyncTitle();
  const [topics] = useSyncTopics();
  const [location] = useSyncLocation();

  const saveMutation = useSaveReport();
  const duplicateMutation = useDuplicateReport();

  const CAN_EDIT = useCanEditReport(`${id}`);

  const handleSave = useCallback(() => {
    toast.promise(
      saveMutation.mutateAsync({
        id: Number(id),
        title: title || reportData?.title || t("selected-area"),
        description: reportData?.description || null,
        topics: topics || (reportData?.topics as TopicView[]) || [],
        location: location || reportData?.location || null,
        locale,
        status: session?.user.collection === "users" ? "published" : "draft",
      }),
      {
        loading: "Saving report...",
        success: "Report saved successfully!",
        error: "Failed to save the report.",
      },
    );
  }, [id, title, topics, location, locale, session, saveMutation, t, reportData]);

  const handleDuplicate = useCallback(() => {
    toast.promise(
      duplicateMutation.mutateAsync(
        {
          title: title || reportData?.title || t("selected-area"),
          description: reportData?.description || null,
          topics: topics || (reportData?.topics as TopicView[]) || [],
          location: location || reportData?.location || null,
          locale,
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
  }, [title, topics, location, locale, session, duplicateMutation, t, reportData, router]);

  if (CAN_EDIT) {
    return (
      <Button onClick={handleSave} className="space-x-2">
        <LuFileText className="h-5 w-5" />
        <span>{t("save")}</span>
      </Button>
    );
  }

  return (
    <Button onClick={handleDuplicate} className="space-x-2">
      <LuFileText className="h-5 w-5" />
      <span>Make a copy</span>
    </Button>
  );
}
