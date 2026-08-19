"use client";

import { useState } from "react";

import { useForm } from "@tanstack/react-form";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useUpdateUserCommunityOptIn, useUser } from "@/lib/user";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

import { User } from "@/payload-types";

function CommunicationsFields({
  userId,
  communityOptIn,
}: Readonly<{
  userId: User["id"];
  communityOptIn: boolean;
}>) {
  const t = useTranslations();
  const updateMutation = useUpdateUserCommunityOptIn();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { communityOptIn },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      try {
        await updateMutation.mutateAsync({ id: userId, communityOptIn: value.communityOptIn });
        toast.success(t("profile-communications-toast-success"), { duration: 2000 });
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : null;
        setSubmitError(message ?? t("profile-communications-submit-error"));
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field name="communityOptIn">
          {(field) => {
            return (
              <Field>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked as boolean)}
                    onBlur={field.handleBlur}
                  />
                  <label
                    htmlFor={field.name}
                    className="text-muted-foreground text-sm leading-snug"
                  >
                    {t("auth-community-optin-label")}
                  </label>
                </div>
              </Field>
            );
          }}
        </form.Field>

        {!!submitError && <FieldError>{submitError}</FieldError>}

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending} className="ml-auto">
            {updateMutation.isPending
              ? t("profile-button-updating-communications")
              : t("profile-button-update-communications")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}

export function CommunicationsForm() {
  const t = useTranslations();
  const { data: session, status: sessionStatus } = useSession();
  const { data: user, isLoading, isError } = useUser(session?.user?.id);

  const isPending = sessionStatus === "loading" || isLoading;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xs font-bold tracking-wide uppercase">
          {t("profile-communications-title")}
        </h3>
      </div>

      {isPending && <Skeleton className="h-10 w-full" />}

      {isError && <FieldError>{t("profile-communications-load-error")}</FieldError>}

      {!!user && <CommunicationsFields userId={user.id} communityOptIn={!!user.communityOptIn} />}
    </div>
  );
}
