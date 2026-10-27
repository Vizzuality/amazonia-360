import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";
import { useSearchParams } from "@/lib/navigation";
import { getSingleValue } from "@/lib/search-params";

import { CheckYourEmail } from "@/containers/auth/check-your-email";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth/check-your-email")({
  loader: ({ context: { locale } }) => getPageMetadata(locale, "check-your-email-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: CheckYourEmailPage,
});

function CheckYourEmailPage() {
  const email = getSingleValue(useSearchParams().getAll("email"));

  return (
    <section className="flex grow items-center justify-center">
      <div className="mx-auto w-full max-w-lg">
        <CheckYourEmail email={email} />
      </div>
    </section>
  );
}
