"use client";

import { useSearchParams } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useRouter } from "@/i18n/navigation";

import { sdk } from "@/services/sdk";

export function ResetPasswordForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const t = useTranslations();

  const searchParams = useSearchParams();

  const formSchema = z
    .object({
      password: z.string().min(6, t("auth-validation-password-min-length")),
      "confirm-password": z.string(),
    })
    .refine((data) => data.password === data["confirm-password"], {
      message: t("auth-validation-passwords-no-match"),
      path: ["confirm-password"],
    });

  const form = useForm({
    defaultValues: {
      password: "",
      "confirm-password": "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.promise(
        // Replace this with your actual reset password API call
        sdk
          .resetPassword({
            collection: "users",
            data: {
              password: value.password,
              token: searchParams.get("token") ?? "",
            },
          })
          .then((r) => {
            if ("errors" in r) {
              const errs = r.errors as {
                message: string;
              }[];
              throw new Error(errs.map((e) => e.message).join(", "));
            }

            router.push("/auth/sign-in");
          })
          .catch((err) => {
            throw new Error(err.message || "Password reset failed");
          }),
        {
          loading: t("auth-toast-resetting-password"),
          success: t("auth-toast-password-reset-success"),
          error: t("auth-toast-password-reset-failed"),
          duration: 2000,
        },
      );
    },
  });

  return (
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-3xl text-primary">{t("auth-reset-password-title")}</CardTitle>
        <CardDescription className="font-medium">
          {t("auth-reset-password-description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="password">
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
                    <FieldDescription>{t("auth-field-password-description")}</FieldDescription>
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
                    <FieldLabel htmlFor={field.name}>
                      {t("auth-field-confirm-new-password")}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>
                      {t("auth-field-confirm-password-description")}
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <FieldGroup>
              <Field>
                <Button type="submit">{t("auth-button-reset-password")}</Button>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
