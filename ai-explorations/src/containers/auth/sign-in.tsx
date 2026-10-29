"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import * as z from "zod";

import { useSession } from "@/lib/auth/react";
import { resolveRedirect } from "@/lib/auth/redirect-url";
import { signInFn } from "@/lib/auth/session.functions";
import { useSearchParams } from "@/lib/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { Link, useRouter } from "@/i18n/navigation";

export type SignInFormProps = React.ComponentProps<"div">;

export function SignInForm(props: SignInFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update: refreshSession } = useSession();
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
        signInFn({ data: { email: value.email, password: value.password } }).then(
          async (result) => {
            if (!result.success) {
              throw new Error(result.reason);
            }

            // The session query never goes stale by itself, so without this the header and
            // the route gates keep treating the user as signed out until a full reload.
            await refreshSession();

            router.push(resolveRedirect(searchParams.getAll("redirectUrl")));
          },
        ),
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
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-3xl text-primary">{t("auth-signin-title")}</CardTitle>
        <CardDescription className="font-medium">{t("auth-signin-description")}</CardDescription>
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
                      className="ml-auto inline-block text-right text-sm font-medium text-muted-foreground underline underline-offset-4"
                    >
                      {t("auth-link-forgot-password")}
                    </Link>
                  </Field>
                );
              }}
            </form.Field>

            <Field>
              <Button type="submit" size="lg">
                {t("auth-button-login")}
              </Button>
            </Field>

            <div className="text-center text-sm font-normal text-muted-foreground">
              {t("auth-agreement-text")}{" "}
              <a
                href="https://www.iadb.org/en/terms-conditions-and-notices/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                {t("auth-agreement-terms")}
              </a>{" "}
              {t("conjunction-and")}{" "}
              <a
                href="https://www.iadb.org/en/home/terms-conditions-and-notices/privacy-notice"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-primary"
              >
                {t("auth-agreement-privacy")}
              </a>
            </div>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="justify-center gap-1 text-sm font-medium text-muted-foreground">
        <span>{t("auth-link-dont-have-account")}</span>
        <Link href="/auth/sign-up" className="font-medium hover:underline">
          {t("auth-link-sign-up")}
        </Link>
      </CardFooter>
    </Card>
  );
}
