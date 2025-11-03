"use client";

import { useForm } from "@tanstack/react-form";
import { signIn } from "next-auth/react";
import { LuGithub } from "react-icons/lu";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { Link, useRouter } from "@/i18n/navigation";

const formSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export function SignInForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();
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
          loading: "Logging in...",
          success: "Logged in successfully!",
          error: "Failed to log in. Please check your credentials and try again.",
          duration: 2000,
        },
      );
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
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
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
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
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                        Forgot your password?
                      </Link>
                    </Field>
                  );
                }}
              </form.Field>

              <Field>
                <Button type="submit">Login</Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/auth/sign-up">Sign up</Link>
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
                  Continue with GitHub
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
