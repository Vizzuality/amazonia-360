"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useSession, signOut } from "next-auth/react";
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
  const { data: session } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const deleteMutation = useDeleteUser();

  const handleDeleteAccount = () => {
    if (!session?.user?.id) return;

    toast.promise(
      deleteMutation.mutateAsync(Number(session.user.id)).then(async () => {
        // Sign out and redirect to home
        await signOut({ redirect: false });
        router.push("/");
      }),
      {
        loading: "Deleting your account...",
        success: "Account deleted successfully!",
        error: "Failed to delete account.",
      },
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wide text-destructive">
            Danger Zone
          </h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Deleting your account is permanent, so please make sure you&apos;re certain before
          proceeding.
        </p>

        <Button variant="destructive" onClick={() => setIsDialogOpen(true)}>
          Delete account
        </Button>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all
              your data from our servers, including all your reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, delete my account"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
