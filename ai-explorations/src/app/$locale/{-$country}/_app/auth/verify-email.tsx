import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";
import { useSearchParams } from "@/lib/navigation";

import { VerifyEmail } from "@/containers/auth/verify-email";

import { redirect } from "@/i18n/navigation";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth/verify-email")({
  beforeLoad: ({ location, context: { locale } }) => {
    const tokens = new URLSearchParams(location.searchStr).getAll("token");
    if (tokens.length !== 1 || !tokens[0]) redirect({ href: "/auth/sign-in", locale });
  },
  loader: ({ context: { locale } }) => getPageMetadata(locale, "verify-email-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const token = useSearchParams().get("token") ?? "";

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <VerifyEmail token={token} />
      </div>
    </section>
  );
}
