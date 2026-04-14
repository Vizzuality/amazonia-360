"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Link } from "@/i18n/navigation";

const COOLDOWN_SECONDS = 30;

interface CheckYourEmailProps extends React.ComponentProps<"div"> {
  email?: string;
}

export function CheckYourEmail({ email, ...props }: CheckYourEmailProps) {
  const t = useTranslations();
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCountdown(COOLDOWN_SECONDS);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleResend = useCallback(() => {
    if (!email || countdown > 0) return;

    startCooldown();

    toast.promise(
      fetch("/v1/api/users/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((res) => {
        if (!res.ok) throw new Error("Request failed");
      }),
      {
        loading: t("auth-check-email-resend-toast-loading"),
        success: t("auth-check-email-resend-toast-success"),
        error: t("auth-check-email-resend-toast-error"),
        duration: 2000,
      },
    );
  }, [email, countdown, startCooldown, t]);

  return (
    <Card className="border-none shadow-none" {...props}>
      <CardHeader>
        <CardTitle className="text-3xl text-primary">{t("auth-check-email-title")}</CardTitle>
        <CardDescription className="font-medium">
          {t("auth-check-email-description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/auth/sign-in">
          <Button size="lg" className="w-full">
            {t("auth-link-back-to-sign-in")}
          </Button>
        </Link>
        {email && (
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleResend}
            disabled={countdown > 0}
          >
            {countdown > 0
              ? t("auth-check-email-resend-button-countdown", {
                  seconds: countdown,
                })
              : t("auth-check-email-resend-button")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
