import { vi } from "vitest";

export type { Session, SessionUser } from "@/lib/auth/session";
export type { SignInResult, VerifyEmailResult } from "@/lib/auth/session.functions";

export const getSessionFn = vi.fn(async () => null);
export const signInFn = vi.fn(async () => ({ success: true }));
export const signOutFn = vi.fn(async () => undefined);
export const signUpFn = vi.fn(async () => ({ success: true }));
export const forgotPasswordFn = vi.fn(async () => undefined);
export const resetPasswordFn = vi.fn(async () => undefined);
export const verifyEmailFn = vi.fn(async () => ({ success: true }));
