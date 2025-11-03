"use client";

import { useSearchParams } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { useRouter } from "@/i18n/navigation";

import { sdk } from "@/services/sdk";

const formSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    "confirm-password": z.string(),
  })
  .refine((data) => data.password === data["confirm-password"], {
    message: "Passwords don't match",
    path: ["confirm-password"],
  });

export function ResetPasswordForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter();

  const searchParams = useSearchParams();

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
          loading: "Resetting your password...",
          success: "Password reset successfully!",
          error:
            "Failed to reset password. Please try again. Token is either invalid or has expired.",
          duration: 2000,
        },
      );
    },
  });

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
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
                    <FieldLabel htmlFor={field.name}>New Password</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>Must be at least 6 characters long.</FieldDescription>
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
                    <FieldLabel htmlFor={field.name}>Confirm New Password</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>Please confirm your new password.</FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <FieldGroup>
              <Field>
                <Button type="submit">Reset Password</Button>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
