"use server";

import { sdk } from "@/services/sdk";

export type VerifyEmailResult = { success: true } | { success: false; reason: "invalid" | "unknown" };

export async function verifyEmailAction(token: string): Promise<VerifyEmailResult> {
  if (!token) {
    return { success: false, reason: "invalid" };
  }

  try {
    await sdk.verifyEmail({
      collection: "users",
      token,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isInvalid = /invalid/i.test(message) || /403/.test(message);

    console.error("[verify-email] verification failed", {
      reason: isInvalid ? "invalid" : "unknown",
      message,
    });

    return { success: false, reason: isInvalid ? "invalid" : "unknown" };
  }
}
