"use client";

import { useForm } from "@tanstack/react-form";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LuGithub } from "react-icons/lu";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { Link, useRouter } from "@/i18n/navigation";

export function SignInForm(props: React.ComponentProps<"div">) {
  const router = useRouter();
  const t = useTranslations();

  const formSchema = z.object({
    email: z.email(t("auth-validation-email-invalid")),
    password: z.string().min(6, t("auth-validation-password-min-length")),
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.promise(
        signIn("credentials", {
          redirect: false,
          email: value.email,
          password: value.password,
        }).then((r) => {
          if (r.error) {
            throw new Error(r.error);
          }

          router.push("/my-area");
        }),
        {
          loading: t("auth-toast-logging-in"),
          success: t("auth-toast-logged-in-success"),
          error: t("auth-toast-login-failed"),
          duration: 2000,
        },
      );
    },
  });

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("auth-signin-title")}</CardTitle>
        <CardDescription>{t("auth-signin-description")}</CardDescription>
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
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}

                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {t("auth-link-forgot-password")}
                    </Link>
                  </Field>
                );
              }}
            </form.Field>

            <Field>
              <Button type="submit">{t("auth-button-login")}</Button>
              <FieldDescription className="text-center">
                {t("auth-link-dont-have-account")}{" "}
                <Link href="/auth/sign-up">{t("auth-link-sign-up")}</Link>
              </FieldDescription>
            </Field>

            <Field>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  signIn("github", { callbackUrl: "/my-area" });
                }}
              >
                <LuGithub className="mr-2 h-4 w-4" />
                {t("auth-button-continue-github")}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
