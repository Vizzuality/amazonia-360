import { useCallback } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LuFileText } from "react-icons/lu";
import { toast } from "sonner";

import { useSaveReport } from "@/lib/report";

import { useSyncLocation, useSyncTitle, useSyncTopics } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";

export default function SaveReport() {
  const locale = useLocale();
  const t = useTranslations();
  const { id } = useParams();

  const { data: session } = useSession();

  const [title] = useSyncTitle();
  const [topics] = useSyncTopics();
  const [location] = useSyncLocation();

  const saveMutation = useSaveReport();

  const handleSave = useCallback(() => {
    toast.promise(
      saveMutation.mutateAsync({
        id: Number(id),
        title: title || t("selected-area"),
        description: null,
        topics: topics || [],
        location: location,
        locale,
        status: session?.user.collection === "users" ? "published" : "draft",
      }),
      {
        loading: "Saving report...",
        success: "Report saved successfully!",
        error: "Failed to save the report.",
      },
    );
  }, [id, title, topics, location, locale, session, saveMutation, t]);

  return (
    <Button onClick={handleSave} className="space-x-2">
      <LuFileText className="h-5 w-5" />
      <span>Save</span>
    </Button>
  );
}
