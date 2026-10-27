import { Suspense } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { requireUserBelowIndexBeforeLoad } from "@/lib/auth/gates";
import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import Header from "@/containers/header";

import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/$locale/{-$country}/private")({
  beforeLoad: requireUserBelowIndexBeforeLoad,
  loader: ({ context: { locale } }) => getPageMetadata(locale, "my-reports-layout"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: PrivateLayout,
});

function PrivateLayout() {
  return (
    <>
      <Toaster position="top-center" richColors />

      <Suspense fallback={null}>
        <Header />
        <Outlet />
      </Suspense>
    </>
  );
}
