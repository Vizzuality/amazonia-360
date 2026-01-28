import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";

import { sketchAtom } from "@/app/(frontend)/store";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";

export const ConfirmDialog = ({ onConfirm }: { onConfirm: () => void }) => {
  const t = useTranslations();
  const sketch = useAtomValue(sketchAtom);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          className="grow"
          disabled={sketch.enabled === "create" || sketch.enabled === "edit"}
        >
          {t("grid-sidebar-report-location-button-confirm")}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("edit-location-confirm-dialog-title")}</AlertDialogTitle>
          <AlertDialogDescription>
            <Markdown>{t("edit-location-confirm-dialog-description")}</Markdown>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">{t("cancel")}</Button>
          </AlertDialogCancel>
          <Button onClick={onConfirm}>{t("grid-sidebar-report-location-button-confirm")}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
