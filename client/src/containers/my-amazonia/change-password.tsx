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
      "confirm-password": z.string(),
    })
    .refine((data) => data.newPassword === data["confirm-password"], {
      message: t("auth-validation-passwords-no-match"),
      path: ["confirm-password"],
    });

  const form = useForm({
    defaultValues: {
      newPassword: "",
      "confirm-password": "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.promise(
        sdk
          .update({
            collection: "users",
            id: Number(session?.user!.id),
            data: {
              password: value.newPassword,
            },
          })
          .then(() => {
            // Reset form after successful update
            form.reset();
          }),
        {
          loading: "Changing your password...",
          success: "Password changed successfully!",
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
        <form.Field name="newPassword">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("auth-field-new-password")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
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

        <form.Field name="confirm-password">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>{t("auth-field-confirm-new-password")}</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
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

        <FieldGroup>
          <Field>
            <Button type="submit" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Changing Password..." : "Change Password"}
            </Button>
          </Field>
        </FieldGroup>
      </FieldGroup>
    </form>
  );
}
