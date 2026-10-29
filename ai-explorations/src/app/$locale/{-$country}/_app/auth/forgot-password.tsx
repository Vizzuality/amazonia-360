import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import { ForgotPasswordForm } from "@/containers/auth/forgot-password";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth/forgot-password")({
  loader: ({ context: { locale } }) => getPageMetadata(locale, "forgot-password-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <ForgotPasswordForm />
      </div>
    </section>
  );
}
