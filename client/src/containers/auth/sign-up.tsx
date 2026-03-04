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
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { Link, useRouter } from "@/i18n/navigation";

import { sdk } from "@/services/sdk";

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();
  const t = useTranslations();

  const formSchema = z
    .object({
      name: z.string().min(2, t("auth-validation-name-min-length")),
      email: z.email(t("auth-validation-email-invalid")),
      password: z.string().min(6, t("auth-validation-password-min-length")),
      "confirm-password": z.string(),
      termsAccepted: z.boolean().refine((val) => val === true, {
        message: t("auth-validation-terms-required"),
      }),
    })
    .refine((data) => data.password === data["confirm-password"], {
      message: t("auth-validation-passwords-no-match"),
      path: ["confirm-password"],
    });

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      "confirm-password": "",
      termsAccepted: false,
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
              name: value.name,
              email: value.email,
              password: value.password,
            },
          })
          .then(() => {
            router.push("/auth/check-your-email");
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
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-primary text-3xl">{t("auth-signup-title")}</CardTitle>
        <CardDescription className="font-medium">{t("auth-signup-description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>{t("auth-field-name")}</FieldLabel>
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

            <form.Field name="termsAccepted">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={field.name}
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked as boolean)}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                      />
                      <label
                        htmlFor={field.name}
                        className="text-muted-foreground text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t("auth-agreement-checkbox")}{" "}
                        <a
                          href="https://www.iadb.org/en/terms-conditions-and-notices/terms-and-conditions"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary font-medium underline underline-offset-4"
                        >
                          {t("auth-agreement-terms")}
                        </a>{" "}
                        {t("conjunction-and")}{" "}
                        <a
                          href="https://www.iadb.org/en/home/terms-conditions-and-notices/privacy-notice"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary font-medium underline underline-offset-4"
                        >
                          {t("auth-agreement-privacy")}
                        </a>
                      </label>
                    </div>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <FieldGroup>
              <Field>
                <Button type="submit" size="lg">
                  {t("auth-button-create-account")}
                </Button>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="text-muted-foreground justify-center gap-1 text-sm font-medium">
        <span>{t("auth-link-already-have-account")}</span>
        <Link href="/auth/sign-in" className="hover:underline">
          {t("auth-link-sign-in")}
        </Link>
      </CardFooter>
    </Card>
  );
}
