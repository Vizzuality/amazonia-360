"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import * as z from "zod";

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

import { Link } from "@/i18n/navigation";

import { sdk } from "@/services/sdk";

export function ForgotPasswordForm(props: React.ComponentProps<"div">) {
  const t = useTranslations();

  const formSchema = z.object({
    email: z.email(t("auth-validation-email-invalid")),
  });

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      toast.promise(
        sdk
          .forgotPassword({
            collection: "users",
            data: {
              email: value.email,
            },
          })
          .then((r) => {
            console.log(r);
            console.log("Password reset email sent");
          }),
        {
          loading: t("auth-toast-sending-reset-email"),
          success: t("auth-toast-reset-email-sent"),
          error: t("auth-toast-reset-email-failed"),
          duration: 2000,
        },
      );
    },
  });

  return (
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-3xl text-primary">{t("auth-forgot-password-title")}</CardTitle>
        <CardDescription className="font-medium">
          {t("auth-forgot-password-description")}
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

            <Field>
              <Button type="submit" size="lg">
                {t("auth-button-send-reset-link")}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <Link href="/auth/sign-in">
          <Button variant="ghost">{t("auth-link-back-to-sign-in")}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
