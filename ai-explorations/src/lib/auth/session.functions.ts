import { createServerFn } from "@tanstack/react-start";

import { getRequestHeaders, setResponseHeader } from "@tanstack/react-start/server";

import * as z from "zod";

import { getSession, type Session } from "@/lib/auth/session";
import { basicAuthFnMiddleware } from "@/lib/server/basic-auth";

import { COUNTRIES } from "@/constants/countries";

export type { Session, SessionUser } from "@/lib/auth/session";

export type SignInResult = { success: true } | { success: false; reason: "credentials" };

export type VerifyEmailResult =
  { success: true } | { success: false; reason: "invalid" | "unknown" };

const PASSWORD_MIN_LENGTH = 6;

const getConfig = async () => (await import("@payload-config")).default;

async function getPayloadInstance() {
  const { getPayload } = await import("payload");
  return getPayload({ config: await getConfig() });
}

function isInvalidTokenError(error: unknown): boolean {
  if (error instanceof Error && /invalid/i.test(error.message)) return true;
  return (error as { status?: unknown } | null)?.status === 403;
}

export const getSessionFn = createServerFn({ method: "GET" })
  .middleware([basicAuthFnMiddleware])
  .handler(async (): Promise<Session | null> => {
    setResponseHeader("Cache-Control", "no-store");
    return getSession(await getPayloadInstance(), getRequestHeaders());
  });

export const signInFn = createServerFn({ method: "POST" })
  .middleware([basicAuthFnMiddleware])
  .validator(z.object({ email: z.string(), password: z.string() }))
  .handler(async ({ data }): Promise<SignInResult> => {
    const { login } = await import("@payloadcms/tanstack-start/server");

    try {
      await login({
        collection: "users",
        config: await getConfig(),
        email: data.email,
        password: data.password,
      });
    } catch {
      return { success: false, reason: "credentials" };
    }

    return { success: true };
  });

export const signOutFn = createServerFn({ method: "POST" })
  .middleware([basicAuthFnMiddleware])
  .handler(async () => {
    const payload = await getPayloadInstance();
    const { user } = await payload.auth({ headers: getRequestHeaders() });
    const { clearAuthCookie } = await import("payload/auth");
    const { logout, tanstackServerAdapter } = await import("@payloadcms/tanstack-start/server");

    if (user?.collection === "users") {
      await logout({ config: await getConfig() });
      return null;
    }

    // `logout` keeps a token whose user was deleted, as it authenticates as nobody.
    if (!user) {
      await clearAuthCookie({
        authConfig: payload.collections.users.config.auth,
        cookiePrefix: payload.config.cookiePrefix,
        serverAdapter: tanstackServerAdapter,
      });
    }

    return null;
  });

export const signUpFn = createServerFn({ method: "POST" })
  .middleware([basicAuthFnMiddleware])
  .validator(
    z.object({
      name: z.string().min(2),
      email: z.email(),
      password: z.string().min(PASSWORD_MIN_LENGTH),
      communityOptIn: z.boolean(),
      countriesOfInterest: z.array(z.enum(COUNTRIES.map((country) => country.iso3))),
    }),
  )
  .handler(async ({ data }) => {
    const payload = await getPayloadInstance();
    await payload.create({ collection: "users", data, depth: 0, overrideAccess: false });
    return null;
  });

export const forgotPasswordFn = createServerFn({ method: "POST" })
  .middleware([basicAuthFnMiddleware])
  .validator(z.object({ email: z.email() }))
  .handler(async ({ data }) => {
    const payload = await getPayloadInstance();
    await payload.forgotPassword({
      collection: "users",
      data: { email: data.email },
      overrideAccess: false,
    });
    return null;
  });

// Local API on purpose: the REST endpoint sets the token cookie and signs the user in.
export const resetPasswordFn = createServerFn({ method: "POST" })
  .middleware([basicAuthFnMiddleware])
  .validator(z.object({ password: z.string().min(PASSWORD_MIN_LENGTH), token: z.string().min(1) }))
  .handler(async ({ data }) => {
    const payload = await getPayloadInstance();
    await payload.resetPassword({ collection: "users", data, overrideAccess: false });
    return null;
  });

export const verifyEmailFn = createServerFn({ method: "POST" })
  .middleware([basicAuthFnMiddleware])
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data: { token } }): Promise<VerifyEmailResult> => {
    if (!token) {
      return { success: false, reason: "invalid" };
    }

    try {
      const payload = await getPayloadInstance();
      await payload.verifyEmail({ collection: "users", token });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const reason = isInvalidTokenError(error) ? "invalid" : "unknown";

      console.error("[verify-email] verification failed", { reason, message });

      return { success: false, reason };
    }
  });
