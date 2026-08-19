"use client";

import { useForm } from "@tanstack/react-form";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useUpdateUserCommunityOptIn, useUser } from "@/lib/user";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup } from "@/components/ui/field";

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

  const form = useForm({
    defaultValues: { communityOptIn },
    onSubmit: async ({ value }) => {
      toast.promise(
        updateMutation.mutateAsync({ id: userId, communityOptIn: value.communityOptIn }),
        {
          loading: t("profile-communications-toast-loading"),
          success: t("profile-communications-toast-success"),
          error: (err) => err.message,
          duration: 2000,
        },
      );
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
  const { data: session } = useSession();
  const { data: user } = useUser(session?.user?.id);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xs font-bold tracking-wide uppercase">
          {t("profile-communications-title")}
        </h3>
      </div>

      {!!user && <CommunicationsFields userId={user.id} communityOptIn={!!user.communityOptIn} />}
    </div>
  );
}
