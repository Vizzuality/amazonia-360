"use server";

import { getPayload } from "payload";

import config from "@/payload.config";

export type VerifyEmailResult =
  | { success: true }
  | { success: false; reason: "invalid" | "unknown" };

export async function verifyEmailAction(token: string): Promise<VerifyEmailResult> {
  if (!token) {
    return { success: false, reason: "invalid" };
  }

  try {
    const payload = await getPayload({ config });
    await payload.verifyEmail({ collection: "users", token });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = (error as { status?: number } | null)?.status;
    const isInvalid = status === 403 || /invalid/i.test(message);

    console.error("[verify-email] verification failed", {
      reason: isInvalid ? "invalid" : "unknown",
      message,
    });

    return { success: false, reason: isInvalid ? "invalid" : "unknown" };
  }
}
