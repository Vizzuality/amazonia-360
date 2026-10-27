import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import { ResetPasswordForm } from "@/containers/auth/reset-password";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth/reset-password")({
  loader: ({ context: { locale } }) => getPageMetadata(locale, "reset-password-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <ResetPasswordForm />
      </div>
    </section>
  );
}
