import { createFileRoute } from "@tanstack/react-router";

import { requireGuestBeforeLoad } from "@/lib/auth/gates";
import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import { SignInForm } from "@/containers/auth/sign-in";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth/sign-in")({
  beforeLoad: requireGuestBeforeLoad,
  loader: ({ context: { locale } }) => getPageMetadata(locale, "signin-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: SignInPage,
});

function SignInPage() {
  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <SignInForm />
      </div>
    </section>
  );
}
