import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AuthSidePanel } from "@/containers/auth/side-panel";

import Image from "@/components/image";

import Custom500 from "../../-components/custom-500";

export const Route = createFileRoute("/$locale/{-$country}/_app/auth")({
  component: AuthLayout,
  errorComponent: Custom500,
});

function AuthLayout() {
  return (
    <>
      <main className="relative flex lg:min-h-[calc(100svh-calc(var(--spacing)*16))]">
        <div className="container flex grow flex-col pt-20 lg:min-h-[calc(100svh-calc(var(--spacing)*16))] lg:pt-16">
          <div className="grid grow grid-cols-12">
            <div className="col-span-12 flex grow flex-col lg:col-span-7">
              <Outlet />
            </div>
          </div>
        </div>

        <AuthSidePanel>
          <Image
            src="/images/auth/auth.webp"
            alt="Authentication background"
            fill
            className="object-cover object-center"
            priority
          />
        </AuthSidePanel>
      </main>
    </>
  );
}
