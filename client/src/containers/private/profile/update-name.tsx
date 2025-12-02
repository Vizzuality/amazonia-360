"use client";

import { useForm } from "@tanstack/react-form";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { sdk } from "@/services/sdk";

export function UpdateNameForm() {
  const { data: session, update } = useSession();
  const t = useTranslations();

  const formSchema = z.object({
    email: z.string().email(t("auth-validation-email-invalid")),
    name: z.string().min(2, t("auth-validation-name-min-length")),
  });

  const form = useForm({
    defaultValues: {
      email: session?.user?.email ?? "",
      name: session?.user?.name ?? "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.promise(
        sdk
          .update({
            collection: "users",
            id: `${session?.user!.id}`,
            data: {
              name: value.name,
            },
          })
          .then(async () => {
            // Update the session with new name
            await update({
              ...session,
              user: {
                ...session?.user,
                name: value.name,
              },
            });
          }),
        {
          loading: t("profile-update-name-toast-loading"),
          success: t("profile-update-name-toast-success"),
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
        <form.Field name="email">
          {(field) => {
            return (
              <Field>
                <FieldLabel htmlFor={field.name}>{t("profile-field-email")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  disabled
                  className="bg-muted"
                />
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="name">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("profile-field-full-name")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.state.isSubmitting} className="ml-auto">
            {form.state.isSubmitting
              ? t("profile-button-updating-name")
              : t("profile-button-update-name")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
