"use client";

import { useForm } from "@tanstack/react-form";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { Link, useRouter } from "@/i18n/navigation";

import { sdk } from "@/services/sdk";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const t = useTranslations();

  const formSchema = z
    .object({
      email: z.email(t("auth-validation-email-invalid")),
      password: z.string().min(6, t("auth-validation-password-min-length")),
      "confirm-password": z.string(),
    })
    .refine((data) => data.password === data["confirm-password"], {
      message: t("auth-validation-passwords-no-match"),
      path: ["confirm-password"],
    });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      "confirm-password": "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.promise(
        sdk
          .create({
            collection: "users",
            data: {
              email: value.email,
              password: value.password,
            },
          })
          .then(async (r) => {
            if (!r) throw new Error("User creation failed");

            return signIn("users", {
              redirect: false,
              email: value.email,
              password: value.password,
            }).then((r) => {
              if (r.error) {
                throw new Error(r.error);
              }

              router.push("/my-amazonia");
            });
          }),
        {
          loading: t("auth-toast-creating-account"),
          success: t("auth-toast-account-created"),
          error: t("auth-toast-account-creation-failed"),
          duration: 2000,
        },
      );
    },
  });

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("auth-signup-title")}</CardTitle>
        <CardDescription>{t("auth-signup-description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t("auth-field-email")}</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
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
            <form.Field name="password">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t("auth-field-password")}</FieldLabel>
                    <Input
                      id={field.name}
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
                    <FieldLabel htmlFor={field.name}>{t("auth-field-confirm-password")}</FieldLabel>
                    <Input
                      id={field.name}
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
                <Button type="submit">{t("auth-button-create-account")}</Button>
                <FieldDescription className="px-6 text-center">
                  {t("auth-link-already-have-account")}{" "}
                  <Link href="/auth/sign-in">{t("auth-link-sign-in")}</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
