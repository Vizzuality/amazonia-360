"use client";

import { useState, useTransition } from "react";

import { useTranslations } from "next-intl";

import { verifyEmailAction } from "@/app/(frontend)/[locale]/(app)/auth/verify-email/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Link } from "@/i18n/navigation";

type Status = "idle" | "success" | "error";

interface VerifyEmailProps extends React.ComponentProps<"div"> {
  token: string;
}

export function VerifyEmail({ token, ...props }: VerifyEmailProps) {
  const t = useTranslations();
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await verifyEmailAction(token);
      setStatus(result.success ? "success" : "error");
    });
  };

  if (status === "success") {
    return (
      <Card className="border-none shadow-none" {...props}>
        <CardHeader>
          <CardTitle className="text-3xl text-primary">{t("auth-verify-email-title")}</CardTitle>
          <CardDescription className="font-medium">
            {t("auth-verify-email-description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-in">
            <Button size="lg" className="w-full">
              {t("auth-link-back-to-sign-in")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="border-none shadow-none" {...props}>
        <CardHeader>
          <CardTitle className="text-3xl text-primary">
            {t("auth-verify-email-error-title")}
          </CardTitle>
          <CardDescription className="font-medium">
            {t("auth-verify-email-error-description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-in">
            <Button size="lg" className="w-full">
              {t("auth-link-back-to-sign-in")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-3xl text-primary">
          {t("auth-verify-email-confirm-title")}
        </CardTitle>
        <CardDescription className="font-medium">
          {t("auth-verify-email-confirm-description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="lg" className="w-full" onClick={handleConfirm} disabled={isPending}>
          {isPending
            ? t("auth-verify-email-confirm-button-pending")
            : t("auth-verify-email-confirm-button")}
        </Button>
      </CardContent>
    </Card>
  );
}
