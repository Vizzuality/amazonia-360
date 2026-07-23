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

export function ChangePasswordForm() {
  const { data: session } = useSession();
  const t = useTranslations();

  const formSchema = z
    .object({
      newPassword: z.string().min(6, t("auth-validation-password-min-length")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("auth-validation-passwords-no-match"),
      path: ["confirmPassword"],
    });

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
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
              password: value.newPassword,
            },
          })
          .then(() => {
            // Reset form after successful update
            form.reset();
          }),
        {
          loading: t("profile-change-password-toast-loading"),
          success: t("profile-change-password-toast-success"),
          error: (err) => err.message,
          duration: 2000,
        },
      );
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xs font-bold tracking-wide uppercase">
          {t("profile-change-password-title")}
        </h3>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="newPassword">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>{t("profile-field-new-password")}</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder={t("profile-field-new-password-placeholder")}
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

          <form.Field name="confirmPassword">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    {t("profile-field-confirm-password")}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    placeholder={t("profile-field-confirm-password-placeholder")}
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
            <Button type="submit" disabled={form.state.isSubmitting} className="w-auto">
              {form.state.isSubmitting
                ? t("profile-button-updating-password")
                : t("profile-button-update-password")}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
