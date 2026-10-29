import { createFileRoute } from "@tanstack/react-router";

import { requireGuestBeforeLoad } from "@/lib/auth/gates";
import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import { AuthSidePanel } from "@/containers/auth/side-panel";
import { SignupForm } from "@/containers/auth/sign-up";
import { SignupBenefits } from "@/containers/auth/signup-benefits";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth/sign-up")({
  beforeLoad: requireGuestBeforeLoad,
  loader: ({ context: { locale } }) => getPageMetadata(locale, "signup-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <>
      <section className="flex grow items-center justify-center">
        <div className="mx-auto w-full max-w-lg">
          <SignupForm />
          <SignupBenefits className="mt-8 lg:hidden" />
        </div>
      </section>

      <AuthSidePanel className="z-10">
        <SignupBenefits className="absolute bottom-0 left-0 w-[78.6667%]" />
      </AuthSidePanel>
    </>
  );
}
