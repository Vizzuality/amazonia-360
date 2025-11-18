import { useCallback } from "react";

import { useParams } from "next/navigation";

import { useLocale } from "next-intl";
import { LuFileText } from "react-icons/lu";
import { toast } from "sonner";

import { useSaveReport } from "@/lib/report";

import { useSyncLocation, useSyncTitle, useSyncTopics } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";

export default function SaveReport() {
  const locale = useLocale();
  const { id } = useParams();

  const [title] = useSyncTitle();
  const [topics] = useSyncTopics();
  const [location] = useSyncLocation();

  const saveMutation = useSaveReport();

  const handleSave = useCallback(() => {
    toast.promise(
      saveMutation
        .mutateAsync({
          id: Number(id),
          title: title || "Untitled Report",
          topics: topics || [],
          location: location,
          locale,
        })
        .then((r) => {
          if (!r) throw new Error("Failed to save report");
          return r;
        })
        .catch((e) => {
          throw new Error(e.message);
        }),
      {
        loading: "Saving report...",
        success: "Report saved successfully!",
        error: "Failed to save the report.",
      },
    );
  }, [id, title, topics, location, locale, saveMutation]);

  return (
    <Button onClick={handleSave} className="space-x-2">
      <LuFileText className="h-5 w-5" />
      <span>Save</span>
    </Button>
  );
}
