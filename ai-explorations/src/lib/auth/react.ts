import { ReactNode, useCallback, useState } from "react";

import { getRouterInstance } from "@tanstack/react-start";

import { AnyRouter, useRouter } from "@tanstack/react-router";

import {
  QueryClient,
  QueryStatus,
  queryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { getSessionFn, Session, signOutFn } from "@/lib/auth/session.functions";

export type { Session, SessionUser } from "@/lib/auth/session.functions";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export type SignOutOptions = {
  redirect?: boolean;
  redirectTo?: string;
};

const SESSION_QUERY_KEY = ["auth", "session"] as const;

export function getSessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => getSessionFn(),
    staleTime: Infinity,
  });
}

function getSessionStatus(status: QueryStatus, session: Session | null): SessionStatus {
  if (status === "pending") return "loading";
  return session ? "authenticated" : "unauthenticated";
}

async function refreshSession(queryClient: QueryClient, router: AnyRouter) {
  await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  const session = await queryClient.fetchQuery(getSessionQueryOptions());
  await router.invalidate();
  return session;
}

export function useSession() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data, status } = useQuery(getSessionQueryOptions());
  const session = data ?? null;

  const update = useCallback(
    async (_data?: unknown): Promise<Session | null> => refreshSession(queryClient, router),
    [queryClient, router],
  );

  return { data: session, status: getSessionStatus(status, session), update };
}

export async function signOut(options: SignOutOptions = {}) {
  await signOutFn();

  if (options.redirect === false) {
    const router = await getRouterInstance();
    await refreshSession(router.options.context.queryClient, router);
    return;
  }

  window.location.assign(options.redirectTo ?? window.location.href);
}

export function SessionProvider({
  session,
  children,
}: Readonly<{ session?: Session | null; children: ReactNode }>) {
  const queryClient = useQueryClient();

  useState(() => {
    if (session !== undefined) queryClient.setQueryData(getSessionQueryOptions().queryKey, session);
  });

  return children;
}
