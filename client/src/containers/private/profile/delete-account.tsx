"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useDeleteUser } from "@/lib/user";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteAccount() {
  const t = useTranslations();
  const { data: session } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const deleteMutation = useDeleteUser();

  const handleDeleteAccount = () => {
    if (!session?.user?.id) return;

    toast.promise(
      deleteMutation.mutateAsync(session.user.id).then(async () => {
        // Sign out and redirect to home
        await signOut({ redirect: false });
        router.push("/");
      }),
      {
        loading: t("profile-delete-account-toast-loading"),
        success: t("profile-delete-account-toast-success"),
        error: t("profile-delete-account-toast-error"),
      },
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wide text-destructive">
            {t("profile-delete-account-title")}
          </h3>
        </div>

        <p className="text-sm text-muted-foreground">{t("profile-delete-account-description")}</p>

        <Button variant="destructive" onClick={() => setIsDialogOpen(true)}>
          {t("profile-delete-account-button")}
        </Button>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile-delete-account-dialog-title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile-delete-account-dialog-description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? t("profile-delete-account-dialog-deleting")
                : t("profile-delete-account-dialog-confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
